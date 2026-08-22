"""High-value behavioral rules over the temporal world model.

Rules describe relationships and behavior, not malware signatures.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from collector.feature_builder import (
    ADMIN_TOOLS,
    BACKUP_TOOLS,
    CREDENTIAL_PATHS,
    DEV_TOOLS,
    DOWNLOAD_RE,
    ENCODED_RE,
    INTERNAL_IP_RE,
    OFFICE_PROCESSES,
    PERSISTENCE_PATHS,
    SCANNER_TOOLS,
    SCRIPT_INTERPRETERS,
)
from collector.schema import AuthEvent, FileEvent, NetworkEvent, ProcessEvent
from world_model.belief_update import Evidence
from world_model.state import WorldState


@dataclass(frozen=True)
class RuleMatch:
    rule_id: str
    title: str
    evidence: Evidence


def _lr(**kwargs: float) -> dict[str, float]:
    base = {
        "normal": 1.0,
        "suspicious_execution": 1.0,
        "persistence": 1.0,
        "credential_access": 1.0,
        "lateral_movement": 1.0,
        "command_and_control": 1.0,
        "compromised": 1.0,
    }
    base.update(kwargs)
    return base


def _name(event) -> str:
    if isinstance(event, ProcessEvent):
        return event.process_name.lower()
    if isinstance(event, FileEvent):
        return event.parent_process.lower()
    if isinstance(event, NetworkEvent):
        return event.source_process.lower()
    return ""


def _cmdline(event) -> str:
    return event.command_line if isinstance(event, ProcessEvent) else ""


BROWSERS = {"msedge.exe", "chrome.exe", "firefox.exe", "iexplore.exe"}


def rule_office_spawns_script(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, ProcessEvent):
        return None
    if event.process_name.lower() not in SCRIPT_INTERPRETERS:
        return None
    if not state.graph.parent_is_office(event.process_id):
        return None
    return Evidence(
        "office_spawns_script",
        _lr(normal=0.35, suspicious_execution=3.4, compromised=1.4),
        "rule",
        index,
    )


def rule_browser_spawns_script(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, ProcessEvent):
        return None
    if event.process_name.lower() not in SCRIPT_INTERPRETERS:
        return None
    parent = state.graph.process_name(event.parent_process_id).lower()
    if parent not in BROWSERS:
        return None
    return Evidence(
        "browser_spawns_script",
        _lr(normal=0.40, suspicious_execution=3.0, command_and_control=1.4),
        "rule",
        index,
    )


def rule_executed_from_temp(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, ProcessEvent):
        return None
    blob = f"{event.process_name} {event.command_line}".lower()
    if "temp" not in blob and "tmp" not in blob:
        return None
    if event.process_name.lower() in DEV_TOOLS | BACKUP_TOOLS | SCANNER_TOOLS:
        return None
    return Evidence(
        "executed_from_temp",
        _lr(normal=0.40, suspicious_execution=3.3, persistence=1.4),
        "rule",
        index,
    )


def rule_script_to_rare_external(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, NetworkEvent):
        return None
    if event.source_process.lower() not in SCRIPT_INTERPRETERS:
        return None
    dest = (event.destination_domain or event.destination_ip).lower()
    external = dest and not INTERNAL_IP_RE.match(event.destination_ip)
    rare = dest.endswith((".xyz", ".top", ".net")) or dest in {
        "cdn-update-check.xyz",
        "mailer-stats.top",
        "cfg-relay.net",
    }
    if not (external and (rare or event.port not in {80, 443, 53})):
        return None
    prior_script = any(
        isinstance(prev, ProcessEvent)
        and prev.process_name.lower() in SCRIPT_INTERPRETERS
        for prev in state.events[: index + 1]
    )
    if not prior_script:
        return None
    return Evidence(
        "script_rare_external",
        _lr(normal=0.4, suspicious_execution=2.2, command_and_control=3.1),
        "rule",
        index,
    )


def rule_encoded_or_download(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    cmdline = _cmdline(event)
    if not cmdline or not (ENCODED_RE.search(cmdline) or DOWNLOAD_RE.search(cmdline)):
        return None
    return Evidence(
        "encoded_or_download",
        _lr(normal=0.45, suspicious_execution=2.8, command_and_control=1.6),
        "rule",
        index,
    )


def rule_persistence_write(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if isinstance(event, FileEvent):
        path = event.file_path.lower()
        if any(token in path for token in PERSISTENCE_PATHS):
            return Evidence(
                "persistence_path",
                _lr(normal=0.5, persistence=3.2, compromised=1.3),
                "rule",
                index,
            )
    if isinstance(event, ProcessEvent) and event.process_name.lower() == "schtasks.exe":
        return Evidence(
            "scheduled_task",
            _lr(normal=0.55, persistence=2.8),
            "rule",
            index,
        )
    return None


def rule_credential_access(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    name = _name(event)
    path = event.file_path.lower() if isinstance(event, FileEvent) else ""
    cmdline = _cmdline(event).lower()
    if name in {"mimikatz.exe", "procdump.exe", "ntdsutil.exe"} or "lsass" in cmdline:
        return Evidence(
            "credential_tool",
            _lr(normal=0.25, credential_access=3.8, compromised=1.8),
            "rule",
            index,
        )
    if any(token in path for token in CREDENTIAL_PATHS):
        return Evidence(
            "credential_artifact",
            _lr(normal=0.35, credential_access=3.2, compromised=1.5),
            "rule",
            index,
        )
    return None


def rule_lateral_after_credentials(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    cred_seen = any(
        item.name in {"credential_tool", "credential_artifact"} for item in state.evidence
    )
    remote = False
    if isinstance(event, ProcessEvent) and event.process_name.lower() in {
        "psexec.exe",
        "wmic.exe",
        "winrm.exe",
    }:
        remote = "\\\\" in event.command_line or event.process_name.lower() == "winrm.exe"
    if isinstance(event, AuthEvent) and event.source != event.destination:
        remote = True
    if isinstance(event, NetworkEvent) and event.port in {445, 3389, 5985}:
        remote = True
    if not (cred_seen and remote):
        return None
    return Evidence(
        "lateral_after_credentials",
        _lr(normal=0.3, lateral_movement=3.6, compromised=2.0),
        "rule",
        index,
    )


def rule_beaconing(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, NetworkEvent):
        return None
    dest = (event.destination_domain or event.destination_ip).lower()
    if not dest:
        return None
    repeats = [
        prev
        for prev in state.events
        if isinstance(prev, NetworkEvent)
        and (prev.destination_domain or prev.destination_ip).lower() == dest
    ]
    if len(repeats) >= 2 and event.connection_frequency >= 4:
        external = not INTERNAL_IP_RE.match(event.destination_ip)
        if external:
            return Evidence(
                "beaconing",
                _lr(normal=0.4, command_and_control=3.0, compromised=1.4),
                "rule",
                index,
            )
    return None


def rule_failed_then_success_auth(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, AuthEvent) or not event.login_success:
        return None
    prior_fail = any(
        isinstance(prev, AuthEvent)
        and not prev.login_success
        and prev.user == event.user
        and prev.destination == event.destination
        for prev in state.events[:index]
    )
    if not prior_fail:
        return None
    return Evidence(
        "failed_then_success_auth",
        _lr(normal=0.55, credential_access=2.0, lateral_movement=1.8),
        "rule",
        index,
    )


def rule_temp_file_then_execute(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, ProcessEvent):
        return None
    temps = [
        prev
        for prev in state.events[:index]
        if isinstance(prev, FileEvent)
        and ("temp" in prev.file_path.lower() or "tmp" in prev.file_path.lower())
    ]
    if not temps:
        return None
    if event.process_name.lower() in SCRIPT_INTERPRETERS | ADMIN_TOOLS | {"cmd.exe"}:
        return Evidence(
            "temp_then_execute",
            _lr(normal=0.5, suspicious_execution=2.1),
            "rule",
            index,
        )
    return None


def rule_multi_host_auth_burst(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, AuthEvent):
        return None
    hosts = {
        prev.destination
        for prev in state.events
        if isinstance(prev, AuthEvent) and prev.user == event.user
    }
    if len(hosts) >= 2:
        return Evidence(
            "multi_host_auth",
            _lr(normal=0.6, lateral_movement=2.4),
            "rule",
            index,
        )
    return None


def rule_office_child_outbound(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, NetworkEvent):
        return None
    if not state.graph.has_office_to_script():
        return None
    if INTERNAL_IP_RE.match(event.destination_ip):
        return None
    return Evidence(
        "office_child_outbound",
        _lr(normal=0.4, suspicious_execution=2.0, command_and_control=2.4),
        "rule",
        index,
    )


def rule_admin_from_unusual_parent(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, ProcessEvent):
        return None
    if event.process_name.lower() not in ADMIN_TOOLS:
        return None
    parent = state.graph.process_name(event.parent_process_id).lower()
    if parent in {"mmc.exe", "services.exe", "svchost.exe", "taskeng.exe"}:
        return None
    return Evidence(
        "admin_unusual_parent",
        _lr(normal=0.45, suspicious_execution=2.2, lateral_movement=1.7),
        "rule",
        index,
    )


# --- Benign explainers that *reduce* attack belief ----------------------------


def rule_dev_context(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    name = _name(event)
    user = getattr(event, "user", "")
    if name in DEV_TOOLS and "dev." in user:
        return Evidence(
            "dev_context",
            _lr(normal=2.6, suspicious_execution=0.55, command_and_control=0.6),
            "rule",
            index,
        )
    return None


def rule_backup_context(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    name = _name(event)
    user = getattr(event, "user", "")
    dest = ""
    if isinstance(event, NetworkEvent):
        dest = (event.destination_domain or "").lower()
    if name in BACKUP_TOOLS or user == "backup.svc" or dest.endswith("corp.local"):
        if name in BACKUP_TOOLS or user == "backup.svc":
            return Evidence(
                "backup_context",
                _lr(normal=2.8, lateral_movement=0.45, command_and_control=0.5),
                "rule",
                index,
            )
    return None


def rule_scanner_context(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    name = _name(event)
    user = getattr(event, "user", "")
    if name in SCANNER_TOOLS or user == "sec.ops":
        return Evidence(
            "scanner_context",
            _lr(normal=2.7, lateral_movement=0.5, command_and_control=0.55),
            "rule",
            index,
        )
    return None


def rule_admin_scheduled_script(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, ProcessEvent):
        return None
    user = event.user.lower()
    cmdline = event.command_line.lower()
    if "admin" in user or user.startswith("it."):
        if "-file" in cmdline and "enc" not in cmdline and "hidden" not in cmdline:
            return Evidence(
                "admin_scheduled_script",
                _lr(normal=2.3, suspicious_execution=0.6),
                "rule",
                index,
            )
    return None


def rule_known_update_domain(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    if not isinstance(event, NetworkEvent):
        return None
    dest = event.destination_domain.lower()
    if dest in {"update.microsoft.com", "github.com", "pypi.org", "wsus.corp.local"}:
        return Evidence(
            "known_update_domain",
            _lr(normal=2.1, command_and_control=0.5),
            "rule",
            index,
        )
    return None


def rule_remote_mgmt_context(state: WorldState, index: int) -> Evidence | None:
    event = state.events[index]
    name = _name(event)
    user = getattr(event, "user", "")
    if name in {"winrm.exe", "sccm_agent.exe", "mstsc.exe"} and "admin" in user:
        return Evidence(
            "remote_mgmt_context",
            _lr(normal=2.2, lateral_movement=0.65),
            "rule",
            index,
        )
    return None


def rule_chain_progression(state: WorldState, index: int) -> Evidence | None:
    """Several distinct attack stages in one process tree raise compromise belief."""
    names = {item.name for item in state.evidence}
    stages = 0
    if names & {
        "office_spawns_script",
        "browser_spawns_script",
        "encoded_or_download",
        "temp_then_execute",
        "executed_from_temp",
    }:
        stages += 1
    if names & {"script_rare_external", "beaconing", "office_child_outbound"}:
        stages += 1
    if names & {"credential_tool", "credential_artifact", "failed_then_success_auth"}:
        stages += 1
    if names & {"lateral_after_credentials", "multi_host_auth", "admin_unusual_parent"}:
        stages += 1
    if names & {"persistence_path", "scheduled_task"}:
        stages += 1
    if stages < 2:
        return None
    # Fire at most once per extra stage so the last event still updates beliefs.
    already = sum(1 for item in state.evidence if item.name == "chain_progression")
    if already >= stages - 1:
        return None
    return Evidence(
        "chain_progression",
        _lr(normal=0.35, compromised=2.4 + 0.3 * stages),
        "rule",
        index,
    )


RULES: list[tuple[str, str, Callable[[WorldState, int], Evidence | None]]] = [
    ("R01", "Office process spawned a script interpreter", rule_office_spawns_script),
    ("R01b", "Browser spawned a script interpreter", rule_browser_spawns_script),
    ("R01c", "Process executed from a temporary path", rule_executed_from_temp),
    ("R02", "Script interpreter reached a rare external destination", rule_script_to_rare_external),
    ("R03", "Encoded command or in-line download behavior", rule_encoded_or_download),
    ("R04", "Persistence path or scheduled task", rule_persistence_write),
    ("R05", "Credential-access tool or artifact", rule_credential_access),
    ("R06", "Remote access after credential indicators", rule_lateral_after_credentials),
    ("R07", "Repeated rare outbound connections", rule_beaconing),
    ("R08", "Failed authentication followed by success", rule_failed_then_success_auth),
    ("R09", "Temporary file followed by interpreter execution", rule_temp_file_then_execute),
    ("R10", "Same user authenticated to multiple hosts", rule_multi_host_auth_burst),
    ("R11", "Office-spawned child made an outbound connection", rule_office_child_outbound),
    ("R12", "Admin tool launched from an unusual parent", rule_admin_from_unusual_parent),
    ("R13", "Developer toolchain in a developer identity context", rule_dev_context),
    ("R14", "Backup tool, service account, or corporate backup target", rule_backup_context),
    ("R15", "Authorized security-scanning workload", rule_scanner_context),
    ("R16", "Admin script with an explicit file path and no encoding", rule_admin_scheduled_script),
    ("R17", "Well-known software-update destination", rule_known_update_domain),
    ("R18", "Enterprise remote-management agent", rule_remote_mgmt_context),
    ("R19", "Multiple attack stages in one trajectory", rule_chain_progression),
]


def evaluate_rules(state: WorldState, index: int) -> list[RuleMatch]:
    matches: list[RuleMatch] = []
    for rule_id, title, fn in RULES:
        evidence = fn(state, index)
        if evidence is None:
            continue
        matches.append(RuleMatch(rule_id, title, evidence))
    return matches
