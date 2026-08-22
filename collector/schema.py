"""Canonical telemetry schemas for process, file, network, and auth events."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Iterator, Union


class EventType(str, Enum):
    PROCESS = "process"
    FILE = "file"
    NETWORK = "network"
    AUTH = "auth"


class SequenceLabel(str, Enum):
    BENIGN = "benign"
    MALICIOUS = "malicious"


@dataclass(frozen=True)
class ProcessEvent:
    process_id: str
    parent_process_id: str
    process_name: str
    command_line: str
    user: str
    timestamp: float
    host: str = "host-01"
    event_type: EventType = EventType.PROCESS

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["event_type"] = self.event_type.value
        return data


@dataclass(frozen=True)
class FileEvent:
    file_hash: str
    file_path: str
    file_created: bool
    file_modified: bool
    parent_process: str
    timestamp: float
    host: str = "host-01"
    user: str = "unknown"
    event_type: EventType = EventType.FILE

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["event_type"] = self.event_type.value
        return data


@dataclass(frozen=True)
class NetworkEvent:
    source_process: str
    destination_ip: str
    destination_domain: str
    port: int
    connection_frequency: int
    timestamp: float
    host: str = "host-01"
    user: str = "unknown"
    event_type: EventType = EventType.NETWORK

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["event_type"] = self.event_type.value
        return data


@dataclass(frozen=True)
class AuthEvent:
    user: str
    source: str
    destination: str
    login_success: bool
    timestamp: float
    host: str = "host-01"
    event_type: EventType = EventType.AUTH

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["event_type"] = self.event_type.value
        return data


Event = Union[ProcessEvent, FileEvent, NetworkEvent, AuthEvent]


@dataclass
class Sequence:
    """A temporally ordered telemetry sequence (one workload or attack chain)."""

    sequence_id: str
    events: list[Event]
    label: SequenceLabel
    family: str
    first_malicious_index: int | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def __iter__(self) -> Iterator[Event]:
        return iter(self.events)

    def __len__(self) -> int:
        return len(self.events)

    @property
    def is_malicious(self) -> bool:
        return self.label == SequenceLabel.MALICIOUS
