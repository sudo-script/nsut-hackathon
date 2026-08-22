"""Normalize heterogeneous telemetry records into the V1 schemas."""

from __future__ import annotations

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


def _as_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y"}
    if value is None:
        return default
    return bool(value)


def normalize_event(record: dict[str, Any]) -> Event:
    """Map a raw event dict onto the canonical process/file/network/auth schema."""
    event_type = str(record.get("event_type") or record.get("type") or "").lower()

    if event_type in {"process", "proc"}:
        return ProcessEvent(
            process_id=str(record.get("process_id") or record.get("pid") or "unknown"),
            parent_process_id=str(
                record.get("parent_process_id") or record.get("ppid") or ""
            ),
            process_name=str(record.get("process_name") or record.get("name") or ""),
            command_line=str(record.get("command_line") or record.get("cmdline") or ""),
            user=str(record.get("user") or "unknown"),
            timestamp=float(record.get("timestamp") or 0.0),
            host=str(record.get("host") or "host-01"),
        )
    if event_type in {"file", "fs"}:
        return FileEvent(
            file_hash=str(record.get("file_hash") or record.get("hash") or ""),
            file_path=str(record.get("file_path") or record.get("path") or ""),
            file_created=_as_bool(record.get("file_created") or record.get("created")),
            file_modified=_as_bool(record.get("file_modified") or record.get("modified")),
            parent_process=str(record.get("parent_process") or record.get("process") or ""),
            timestamp=float(record.get("timestamp") or 0.0),
            host=str(record.get("host") or "host-01"),
            user=str(record.get("user") or "unknown"),
        )
    if event_type in {"network", "net", "conn"}:
        return NetworkEvent(
            source_process=str(record.get("source_process") or record.get("process") or ""),
            destination_ip=str(record.get("destination_ip") or record.get("dst_ip") or ""),
            destination_domain=str(
                record.get("destination_domain") or record.get("domain") or ""
            ),
            port=int(record.get("port") or 0),
            connection_frequency=int(record.get("connection_frequency") or 1),
            timestamp=float(record.get("timestamp") or 0.0),
            host=str(record.get("host") or "host-01"),
            user=str(record.get("user") or "unknown"),
        )
    if event_type in {"auth", "authentication", "login"}:
        return AuthEvent(
            user=str(record.get("user") or "unknown"),
            source=str(record.get("source") or record.get("src") or ""),
            destination=str(record.get("destination") or record.get("dst") or ""),
            login_success=_as_bool(record.get("login_success"), default=True),
            timestamp=float(record.get("timestamp") or 0.0),
            host=str(record.get("host") or "host-01"),
        )
    raise ValueError(f"Unsupported event type: {event_type!r}")


def normalize_sequence(payload: dict[str, Any]) -> Sequence:
    events = [normalize_event(item) for item in payload.get("events", [])]
    label_raw = str(payload.get("label") or "benign").lower()
    label = SequenceLabel.MALICIOUS if label_raw == "malicious" else SequenceLabel.BENIGN
    return Sequence(
        sequence_id=str(payload.get("sequence_id") or "seq-unknown"),
        events=events,
        label=label,
        family=str(payload.get("family") or "unknown"),
        first_malicious_index=payload.get("first_malicious_index"),
        metadata=dict(payload.get("metadata") or {}),
    )
