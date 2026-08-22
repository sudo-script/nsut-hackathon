"""Dummy lab campaigns for the interactive visual demo.

These are behavioral simulations only: no malware samples, no exploits,
and no packets leave this process. Visual 'impact' counters are fictional
lab scores used to compare detectors.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Any

from collector.schema import (
    AuthEvent,
    Event,
    FileEvent,
    NetworkEvent,
    ProcessEvent,
    Sequence,
    SequenceLabel,
)


def _pid(rng: random.Random, prefix: str) -> str:
    return f"{prefix}-{rng.randint(100, 999)}"


def _ts(step: int) -> float:
    return 1_700_000_000.0 + step * 45.0


def process_event(
    rng: random.Random,
    *,
    name: str,
    parent: str,
    cmdline: str,
    user: str,
    step: int,
    host: str = "alice-pc",
    pid: str | None = None,
) -> ProcessEvent:
    return ProcessEvent(
        process_id=pid or _pid(rng, name.split(".")[0][:8]),
        parent_process_id=parent,
        process_name=name,
        command_line=cmdline,
        user=user,
        timestamp=_ts(step),
        host=host,
    )


def file_event(*, path: str, parent: str, step: int, user: str = "alice") -> FileEvent:
    return FileEvent(
        file_hash=f"sim-{abs(hash(path)) % 10**8:08d}",
        file_path=path,
        file_created=True,
        file_modified=False,
        parent_process=parent,
        timestamp=_ts(step),
        host="alice-pc",
        user=user,
    )


def net_event(
    *,
    process: str,
    domain: str,
    ip: str,
    port: int,
    step: int,
    freq: int = 1,
    user: str = "alice",
    host: str = "alice-pc",
) -> NetworkEvent:
    return NetworkEvent(
        source_process=process,
        destination_ip=ip,
        destination_domain=domain,
        port=port,
        connection_frequency=freq,
        timestamp=_ts(step),
        host=host,
        user=user,
    )


def auth_event(*, user: str, source: str, dest: str, step: int, success: bool = True) -> AuthEvent:
    return AuthEvent(
        user=user,
        source=source,
        destination=dest,
        login_success=success,
        timestamp=_ts(step),
        host=source,
    )


@dataclass
class VisualBeat:
    stage: str
    title: str
    narrative: str
    source: str
    target: str
    visual: str
    impact: dict[str, int]
    event: Event
    stolen_name: str | None = None


@dataclass
class Campaign:
    campaign_id: str
    specimen: str
    title: str
    blurb: str
    beats: list[VisualBeat] = field(default_factory=list)

    def as_sequence(self) -> Sequence:
        return Sequence(
            sequence_id=self.campaign_id,
            events=[beat.event for beat in self.beats],
            label=SequenceLabel.MALICIOUS
            if self.specimen != "DUMMY-BENIGN"
            else SequenceLabel.BENIGN,
            family=self.specimen.lower(),
            first_malicious_index=0 if self.specimen != "DUMMY-BENIGN" else None,
        )


def _impact(**kwargs: int) -> dict[str, int]:
    base = {
        "hosts_discovered": 0,
        "services_fingerprinted": 0,
        "ports_probed": 0,
        "files_touched": 0,
        "mb_exfiltrated": 0,
        "credentials_touched": 0,
        "hosts_pivoted": 0,
    }
    base.update(kwargs)
    return base


def build_campaign(scenario: str, stealth: int, noise: bool, seed: int = 11) -> Campaign:
    rng = random.Random(seed + stealth)
    stealth = max(0, min(100, int(stealth)))
    noisy = bool(noise)
    builders = {
        "full_chain": _full_chain,
        "recon_footprint": _recon_footprint,
        "pentest_lateral": _pentest_lateral,
        "data_theft": _data_theft,
        "benign_admin": _benign_admin,
    }
    builder = builders.get(scenario, _full_chain)
    campaign = builder(rng, stealth)
    if noisy and campaign.specimen != "DUMMY-BENIGN":
        campaign.beats = _interleave_noise(rng, campaign.beats)
    return campaign


def _full_chain(rng: random.Random, stealth: int) -> Campaign:
    user = "alice"
    word = process_event(
        rng,
        name="WINWORD.EXE",
        parent="explorer.exe",
        cmdline="WINWORD.EXE C:\\Users\\alice\\Downloads\\invoice.docm",
        user=user,
        step=0,
        pid="word-1",
    )
    if stealth >= 65:
        script_cmd = "powershell.exe Get-ChildItem $env:TEMP"
    else:
        script_cmd = "powershell.exe -nop -w hidden -enc SQBFAFgA"
    ps = process_event(
        rng,
        name="powershell.exe",
        parent=word.process_id,
        cmdline=script_cmd,
        user=user,
        step=1,
        pid="ps-1",
    )
    beats = [
        VisualBeat(
            "initial",
            "Dummy dropper opens a document",
            "Lab implant starts as a document process. No real file is executed.",
            "attacker",
            "workstation",
            "drop",
            _impact(),
            word,
        ),
        VisualBeat(
            "execution",
            "Office process spawned a script host",
            "WINWORD launches PowerShell — the first behavioral link in the chain.",
            "workstation",
            "workstation",
            "spawn",
            _impact(),
            ps,
        ),
        VisualBeat(
            "recon",
            "Internal host discovery",
            "Dummy recon lists nearby lab hosts. Packets never leave the simulator.",
            "workstation",
            "fileserver",
            "probe",
            _impact(hosts_discovered=2),
            net_event(
                process="powershell.exe",
                domain="",
                ip="10.0.1.20",
                port=445,
                step=2,
                freq=3,
            ),
        ),
        VisualBeat(
            "recon",
            "Directory / DC sweep",
            "Second probe maps the domain controller address.",
            "workstation",
            "dc",
            "probe",
            _impact(hosts_discovered=1),
            net_event(process="powershell.exe", domain="", ip="10.0.2.5", port=389, step=3, freq=2),
        ),
        VisualBeat(
            "footprint",
            "Service fingerprinting",
            "Footprinting labels OS and shares on discovered hosts.",
            "workstation",
            "fileserver",
            "fingerprint",
            _impact(services_fingerprinted=3),
            process_event(
                rng,
                name="powershell.exe",
                parent=ps.process_id,
                cmdline="powershell.exe Get-ChildItem $env:TEMP",
                user=user,
                step=4,
            ),
        ),
        VisualBeat(
            "pentest",
            "Simulated service probe",
            "Cosmetic pentest pulse against file-share and remote-admin ports.",
            "workstation",
            "fileserver",
            "scan",
            _impact(ports_probed=4),
            net_event(
                process="powershell.exe",
                domain="",
                ip="10.0.1.20",
                port=445,
                step=5,
                freq=6,
            ),
        ),
        VisualBeat(
            "credentials",
            "Credential-access indicator",
            "Lab-only credential tool pattern (procdump/lsass naming). No dump is made.",
            "workstation",
            "dc",
            "creds",
            _impact(credentials_touched=1, files_touched=1),
            process_event(
                rng,
                name="procdump.exe" if stealth < 70 else "powershell.exe",
                parent=ps.process_id,
                cmdline="procdump.exe -ma lsass.exe lsass.dmp"
                if stealth < 70
                else "powershell.exe Get-ChildItem $env:TEMP",
                user=user,
                step=6,
            ),
        ),
        VisualBeat(
            "exfil",
            "Dummy data theft to a rare host",
            "Animated files leave the vault toward the attacker node. Bytes are fake.",
            "vault",
            "attacker",
            "exfil",
            _impact(mb_exfiltrated=48, files_touched=12),
            net_event(
                process="powershell.exe",
                domain="cdn-update-check.xyz",
                ip="185.22.61.14",
                port=443,
                step=7,
                freq=8 if stealth < 50 else 3,
            ),
            stolen_name="salary_export.csv",
        ),
        VisualBeat(
            "exfil",
            "Second staged exfil burst",
            "Another dummy archive is copied to the rare destination.",
            "vault",
            "attacker",
            "exfil",
            _impact(mb_exfiltrated=36, files_touched=7),
            net_event(
                process="powershell.exe",
                domain="mailer-stats.top",
                ip="91.200.12.88",
                port=443,
                step=8,
                freq=6,
            ),
            stolen_name="eng_source_bundle.zip",
        ),
        VisualBeat(
            "lateral",
            "Simulated pivot to a second host",
            "Dummy lateral tool and auth edge. Nothing is isolated on a real machine.",
            "workstation",
            "fileserver",
            "pivot",
            _impact(hosts_pivoted=1),
            process_event(
                rng,
                name="psexec.exe" if stealth < 75 else "winrm.exe",
                parent=ps.process_id,
                cmdline="psexec.exe \\\\fileserver-01 -s cmd"
                if stealth < 75
                else "winrm.exe enumerate winrm/config",
                user=user,
                step=9,
            ),
        ),
        VisualBeat(
            "lateral",
            "Auth to the file server",
            "Successful lab authentication after the credential indicator.",
            "workstation",
            "fileserver",
            "auth",
            _impact(hosts_pivoted=0),
            auth_event(user=user, source="alice-pc", dest="fileserver-01", step=10),
        ),
    ]
    return Campaign(
        "camp-full",
        "DUMMY-HYDRA",
        "Full dummy campaign",
        "Recon → footprint → simulated pentest → credentials → theft → pivot.",
        beats,
    )


def _recon_footprint(rng: random.Random, stealth: int) -> Campaign:
    user = "alice"
    edge = process_event(
        rng,
        name="msedge.exe",
        parent="explorer.exe",
        cmdline="msedge.exe https://intranet.corp.local",
        user=user,
        step=0,
        pid="edge-1",
    )
    ps = process_event(
        rng,
        name="powershell.exe",
        parent=edge.process_id,
        cmdline="powershell.exe Get-ChildItem $env:TEMP",
        user=user,
        step=1,
        pid="ps-r",
    )
    beats = [
        VisualBeat(
            "initial",
            "Browser session on the workstation",
            "A normal-looking browser parent for the dummy implant.",
            "attacker",
            "workstation",
            "drop",
            _impact(),
            edge,
        ),
        VisualBeat(
            "execution",
            "Browser spawned a script host",
            "Unexpected interpreter launch — early recon foothold.",
            "workstation",
            "workstation",
            "spawn",
            _impact(),
            ps,
        ),
        VisualBeat(
            "recon",
            "Subnet host discovery",
            "Dummy footprinting lights up lab hosts as they are 'found'.",
            "workstation",
            "fileserver",
            "probe",
            _impact(hosts_discovered=2),
            net_event(process="powershell.exe", domain="", ip="10.0.1.20", port=80, step=2, freq=4),
        ),
        VisualBeat(
            "recon",
            "DC locator probe",
            "Second discovery pulse toward the directory host.",
            "workstation",
            "dc",
            "probe",
            _impact(hosts_discovered=1),
            net_event(process="powershell.exe", domain="", ip="10.0.2.5", port=88, step=3, freq=3),
        ),
        VisualBeat(
            "footprint",
            "Share and service labels",
            "Hosts receive OS/service tags. No real scan traffic is sent.",
            "workstation",
            "fileserver",
            "fingerprint",
            _impact(services_fingerprinted=4),
            process_event(
                rng,
                name="powershell.exe",
                parent=ps.process_id,
                cmdline="powershell.exe Get-ChildItem $env:TEMP",
                user=user,
                step=4,
            ),
        ),
        VisualBeat(
            "footprint",
            "Rare callback during recon",
            "Low-and-slow dummy check-in to a rare domain.",
            "workstation",
            "attacker",
            "beacon",
            _impact(services_fingerprinted=1),
            net_event(
                process="powershell.exe",
                domain="cdn-update-check.xyz",
                ip="185.22.61.14",
                port=443,
                step=5,
                freq=2 if stealth > 50 else 5,
            ),
        ),
    ]
    return Campaign(
        "camp-recon",
        "DUMMY-RECON",
        "Recon + footprinting",
        "Discovery and fingerprinting only — no theft, no pivot.",
        beats,
    )


def _pentest_lateral(rng: random.Random, stealth: int) -> Campaign:
    user = "alice"
    word = process_event(
        rng,
        name="EXCEL.EXE",
        parent="explorer.exe",
        cmdline="EXCEL.EXE C:\\Users\\alice\\Downloads\\q3.xlsx",
        user=user,
        step=0,
        pid="xl-1",
    )
    cmd = process_event(
        rng,
        name="cmd.exe",
        parent=word.process_id,
        cmdline="cmd.exe /c whoami",
        user=user,
        step=1,
        pid="cmd-1",
    )
    beats = [
        VisualBeat(
            "initial",
            "Spreadsheet launches the dummy tool",
            "Office parent for a simulated pentest chain.",
            "attacker",
            "workstation",
            "drop",
            _impact(),
            word,
        ),
        VisualBeat(
            "execution",
            "Office spawned cmd.exe",
            "Script host appears under Excel.",
            "workstation",
            "workstation",
            "spawn",
            _impact(),
            cmd,
        ),
        VisualBeat(
            "pentest",
            "Simulated SMB / RPC probes",
            "Port pulses on the file server. No exploit payload exists.",
            "workstation",
            "fileserver",
            "scan",
            _impact(ports_probed=5, hosts_discovered=1),
            net_event(process="cmd.exe", domain="", ip="10.0.1.20", port=445, step=2, freq=8),
        ),
        VisualBeat(
            "pentest",
            "Simulated remote-admin port probe",
            "Cosmetic hit on a management port.",
            "workstation",
            "dc",
            "scan",
            _impact(ports_probed=3, hosts_discovered=1),
            net_event(process="cmd.exe", domain="", ip="10.0.2.5", port=3389, step=3, freq=4),
        ),
        VisualBeat(
            "credentials",
            "Failed then successful lab login",
            "Auth spray is simulated as two auth events.",
            "workstation",
            "dc",
            "creds",
            _impact(credentials_touched=1),
            auth_event(user=user, source="alice-pc", dest="dc-01", step=4, success=False),
        ),
        VisualBeat(
            "credentials",
            "Lab login succeeds",
            "Second attempt succeeds — credential-access belief should rise.",
            "workstation",
            "dc",
            "auth",
            _impact(credentials_touched=1),
            auth_event(user=user, source="alice-pc", dest="dc-01", step=5, success=True),
        ),
        VisualBeat(
            "lateral",
            "Dummy lateral tool",
            "psexec-style process name only. Isolated lab, no remote command.",
            "workstation",
            "fileserver",
            "pivot",
            _impact(hosts_pivoted=1),
            process_event(
                rng,
                name="psexec.exe",
                parent=cmd.process_id,
                cmdline="psexec.exe \\\\fileserver-01 -s cmd",
                user=user,
                step=6,
            ),
        ),
    ]
    return Campaign(
        "camp-pentest",
        "DUMMY-LATERAL",
        "Simulated pentest + pivot",
        "Service probes, auth edges, dummy lateral tool.",
        beats,
    )


def _data_theft(rng: random.Random, stealth: int) -> Campaign:
    user = "alice"
    rundll = process_event(
        rng,
        name="rundll32.exe",
        parent="explorer.exe",
        cmdline="rundll32.exe C:\\Users\\alice\\AppData\\Local\\Temp\\sync.dll,Start",
        user=user,
        step=0,
        pid="rl-1",
    )
    beats = [
        VisualBeat(
            "execution",
            "Temp-path dummy implant",
            "rundll32 loads a fake temp DLL — execution from a staging path.",
            "attacker",
            "workstation",
            "drop",
            _impact(),
            rundll,
        ),
        VisualBeat(
            "exfil",
            "Vault file touch",
            "Dummy read of a finance export. File is synthetic.",
            "workstation",
            "vault",
            "steal",
            _impact(files_touched=4),
            file_event(
                path="\\\\fileserver-01\\vault\\salary_export.csv",
                parent="rundll32.exe",
                step=1,
            ),
            stolen_name="salary_export.csv",
        ),
        VisualBeat(
            "exfil",
            "First exfil to rare destination",
            "Animated copy toward the attacker. Volume is a lab counter.",
            "vault",
            "attacker",
            "exfil",
            _impact(mb_exfiltrated=64, files_touched=4),
            net_event(
                process="rundll32.exe",
                domain="mailer-stats.top",
                ip="91.200.12.88",
                port=443,
                step=2,
                freq=6,
            ),
            stolen_name="salary_export.csv",
        ),
        VisualBeat(
            "exfil",
            "Source-bundle theft",
            "Second dummy archive leaves the vault.",
            "vault",
            "attacker",
            "exfil",
            _impact(mb_exfiltrated=90, files_touched=9),
            net_event(
                process="rundll32.exe",
                domain="mailer-stats.top",
                ip="91.200.12.88",
                port=443,
                step=3,
                freq=6,
            ),
            stolen_name="eng_source_bundle.zip",
        ),
        VisualBeat(
            "exfil",
            "Beaconing rare host",
            "Repeated rare outbound — C2-like dummy callback.",
            "workstation",
            "attacker",
            "beacon",
            _impact(mb_exfiltrated=12),
            net_event(
                process="rundll32.exe",
                domain="mailer-stats.top",
                ip="91.200.12.88",
                port=443,
                step=4,
                freq=8,
            ),
        ),
    ]
    return Campaign(
        "camp-theft",
        "DUMMY-MOTH",
        "Dummy data theft",
        "Temp execution, vault touch, repeated rare outbound.",
        beats,
    )


def _benign_admin(rng: random.Random, stealth: int) -> Campaign:
    user = "admin.lee"
    beats = [
        VisualBeat(
            "benign",
            "Weekly admin health script",
            "Legitimate PowerShell with an explicit file path.",
            "workstation",
            "workstation",
            "benign",
            _impact(),
            process_event(
                rng,
                name="powershell.exe",
                parent="mmc.exe",
                cmdline="powershell.exe -File C:\\IT\\weekly_health.ps1",
                user=user,
                step=0,
            ),
        ),
        VisualBeat(
            "benign",
            "WSUS / corporate update check",
            "Admin script talking to a known internal update host.",
            "workstation",
            "dc",
            "benign",
            _impact(),
            net_event(
                process="powershell.exe",
                domain="wsus.corp.local",
                ip="10.0.1.20",
                port=8530,
                step=1,
                user=user,
            ),
        ),
        VisualBeat(
            "benign",
            "Backup copy to the file server",
            "robocopy-style backup — should stay quiet in the world model.",
            "workstation",
            "fileserver",
            "benign",
            _impact(files_touched=20, mb_exfiltrated=0),
            process_event(
                rng,
                name="robocopy.exe",
                parent="taskeng.exe",
                cmdline="robocopy D:\\Shares \\\\fileserver-01\\backup /MIR",
                user="backup.svc",
                step=2,
            ),
        ),
        VisualBeat(
            "benign",
            "Backup SMB to corp target",
            "Internal backup destination, service account.",
            "fileserver",
            "fileserver",
            "benign",
            _impact(),
            net_event(
                process="robocopy.exe",
                domain="backup.corp.local",
                ip="10.0.2.5",
                port=445,
                step=3,
                freq=8,
                user="backup.svc",
            ),
        ),
    ]
    return Campaign(
        "camp-benign",
        "DUMMY-BENIGN",
        "Legitimate admin / backup",
        "Control scenario: PowerShell and SMB that should not look like theft.",
        beats,
    )


def _interleave_noise(rng: random.Random, beats: list[VisualBeat]) -> list[VisualBeat]:
    noise = VisualBeat(
        "benign",
        "Office autosave (noise)",
        "Harmless document save mixed into the campaign.",
        "workstation",
        "workstation",
        "benign",
        _impact(),
        file_event(
            path="C:\\Users\\alice\\Docs\\notes.docx",
            parent="WINWORD.EXE",
            step=99,
        ),
    )
    if len(beats) < 3:
        return beats + [noise]
    insert_at = min(2, len(beats) - 1)
    copy = list(beats)
    copy.insert(insert_at, noise)
    return copy


def campaign_public_meta(campaign: Campaign) -> dict[str, Any]:
    return {
        "campaign_id": campaign.campaign_id,
        "specimen": campaign.specimen,
        "title": campaign.title,
        "blurb": campaign.blurb,
        "n_events": len(campaign.beats),
        "stages": [beat.stage for beat in campaign.beats],
    }
