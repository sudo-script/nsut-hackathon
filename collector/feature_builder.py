"""Build shared numeric features used by every baseline and the world model."""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field

from collector.schema import AuthEvent, Event, FileEvent, NetworkEvent, ProcessEvent


SCRIPT_INTERPRETERS = {
    "powershell.exe",
    "pwsh.exe",
    "cmd.exe",
    "wscript.exe",
    "cscript.exe",
    "mshta.exe",
    "bash",
    "sh",
    "python.exe",
    "python",
}

OFFICE_PROCESSES = {
    "winword.exe",
    "excel.exe",
    "powerpnt.exe",
    "outlook.exe",
}

ADMIN_TOOLS = {
    "psexec.exe",
    "wmic.exe",
    "net.exe",
    "net1.exe",
    "schtasks.exe",
    "sc.exe",
    "reg.exe",
    "mimikatz.exe",
    "procdump.exe",
    "ntdsutil.exe",
}

DEV_TOOLS = {
    "git",
    "git.exe",
    "npm",
    "node",
    "python",
    "python.exe",
    "gcc",
    "make",
    "cargo",
    "go",
    "javac",
    "mvn",
}

BACKUP_TOOLS = {
    "robocopy.exe",
    "wbadmin.exe",
    "rsync",
    "tar",
    "restic",
}

SCANNER_TOOLS = {
    "nessus.exe",
    "nmap",
    "qualys.exe",
    "crowdstrike_scan.exe",
}

REMOTE_MGMT = {
    "winrm.exe",
    "ssh",
    "sshd",
    "mstsc.exe",
    "sccm_agent.exe",
}

CREDENTIAL_PATHS = (
    "/etc/shadow",
    "sam",
    "ntds.dit",
    "lsass",
    ".ssh/",
    "login.keychain",
)

PERSISTENCE_PATHS = (
    "startup",
    "cron",
    "/etc/rc",
    "launchagents",
    "launchdaemons",
    "systemd",
    "run/key",
)

ENCODED_RE = re.compile(r"(-enc|-e\b|-encodedcommand|frombase64string|bypass)", re.I)
DOWNLOAD_RE = re.compile(r"(wget|curl|invoke-webrequest|iwr|downloadstring|certutil)", re.I)
INTERNAL_IP_RE = re.compile(r"^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.)")


def _entropy(text: str) -> float:
    if not text:
        return 0.0
    counts = Counter(text)
    length = float(len(text))
    return -sum((c / length) * math.log2(c / length) for c in counts.values())


def _name(event: Event) -> str:
    if isinstance(event, ProcessEvent):
        return event.process_name.lower()
    if isinstance(event, FileEvent):
        return event.parent_process.lower()
    if isinstance(event, NetworkEvent):
        return event.source_process.lower()
    return ""


FEATURE_NAMES = [
    "is_process",
    "is_file",
    "is_network",
    "is_auth",
    "is_script_interpreter",
    "is_office",
    "is_admin_tool",
    "is_dev_tool",
    "is_backup_tool",
    "is_scanner",
    "is_remote_mgmt",
    "cmdline_length",
    "cmdline_entropy",
    "has_encoded_flag",
    "has_download_flag",
    "hour_of_day",
    "user_is_admin",
    "is_temp_path",
    "is_startup_or_persistence_path",
    "looks_like_credential_access",
    "dest_is_external",
    "dest_rarity",
    "port_is_uncommon",
    "connection_frequency",
    "login_failed",
    "login_success",
    "is_remote_auth",
]


def feature_names() -> list[str]:
    return list(FEATURE_NAMES)


@dataclass
class FeatureBuilder:
    """Fit destination rarity on a corpus, then vectorize individual events."""

    destination_counts: Counter[str] = field(default_factory=Counter)
    _fitted: bool = False

    def fit(self, events: list[Event]) -> FeatureBuilder:
        for event in events:
            if isinstance(event, NetworkEvent):
                key = event.destination_domain or event.destination_ip
                if key:
                    self.destination_counts[key.lower()] += 1
        self._fitted = True
        return self

    def transform_event(self, event: Event) -> list[float]:
        name = _name(event)
        cmdline = event.command_line if isinstance(event, ProcessEvent) else ""
        user = getattr(event, "user", "unknown") or "unknown"
        hour = (float(getattr(event, "timestamp", 0.0)) / 3600.0) % 24.0

        file_path = event.file_path.lower() if isinstance(event, FileEvent) else ""
        dest = ""
        port = 0
        freq = 0
        if isinstance(event, NetworkEvent):
            dest = (event.destination_domain or event.destination_ip).lower()
            port = event.port
            freq = event.connection_frequency

        dest_count = self.destination_counts.get(dest, 0)
        dest_rarity = 1.0 if dest and dest_count <= 2 else 0.0
        if dest and dest_count > 2:
            dest_rarity = min(1.0, 2.0 / dest_count)

        login_success = isinstance(event, AuthEvent) and event.login_success
        login_failed = isinstance(event, AuthEvent) and not event.login_success
        remote_auth = isinstance(event, AuthEvent) and event.source != event.destination

        vector = [
            float(isinstance(event, ProcessEvent)),
            float(isinstance(event, FileEvent)),
            float(isinstance(event, NetworkEvent)),
            float(isinstance(event, AuthEvent)),
            float(name in SCRIPT_INTERPRETERS),
            float(name in OFFICE_PROCESSES),
            float(name in ADMIN_TOOLS),
            float(name in DEV_TOOLS),
            float(name in BACKUP_TOOLS),
            float(name in SCANNER_TOOLS),
            float(name in REMOTE_MGMT),
            float(min(len(cmdline), 400) / 400.0),
            min(_entropy(cmdline) / 6.0, 1.0),
            float(bool(ENCODED_RE.search(cmdline))),
            float(bool(DOWNLOAD_RE.search(cmdline))),
            hour / 24.0,
            float("admin" in user.lower() or user.lower() in {"root", "system"}),
            float("temp" in file_path or "tmp" in file_path or "appdata" in file_path),
            float(any(token in file_path for token in PERSISTENCE_PATHS)),
            float(
                any(token in file_path for token in CREDENTIAL_PATHS)
                or name in {"mimikatz.exe", "procdump.exe", "ntdsutil.exe"}
                or "lsass" in cmdline.lower()
            ),
            float(
                isinstance(event, NetworkEvent)
                and bool(dest)
                and not INTERNAL_IP_RE.match(event.destination_ip)
                and not dest.endswith((".corp.local", ".internal"))
            ),
            dest_rarity,
            float(port not in {0, 80, 443, 22, 53, 445, 3389, 5985} and port != 0),
            min(freq / 20.0, 1.0),
            float(login_failed),
            float(login_success),
            float(remote_auth),
        ]
        return vector

    def transform(self, events: list[Event]) -> list[list[float]]:
        return [self.transform_event(event) for event in events]
