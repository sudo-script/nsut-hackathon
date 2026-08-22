"""Persist and reload sequence datasets as JSONL."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from collector.event_normalizer import normalize_sequence
from collector.schema import Event, Sequence, SequenceLabel


def _event_payload(event: Event) -> dict:
    return event.to_dict()


def save_sequences(sequences: Iterable[Sequence], path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for sequence in sequences:
            payload = {
                "sequence_id": sequence.sequence_id,
                "label": sequence.label.value,
                "family": sequence.family,
                "first_malicious_index": sequence.first_malicious_index,
                "metadata": sequence.metadata,
                "events": [_event_payload(event) for event in sequence.events],
            }
            handle.write(json.dumps(payload) + "\n")


def load_sequences(path: str | Path) -> list[Sequence]:
    sequences: list[Sequence] = []
    with Path(path).open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            sequences.append(normalize_sequence(json.loads(line)))
    return sequences


def flatten_events(
    sequences: Iterable[Sequence],
) -> tuple[list[Event], list[int], list[str], list[str]]:
    """Return events, event-level labels, family names, and sequence ids."""
    events: list[Event] = []
    labels: list[int] = []
    families: list[str] = []
    seq_ids: list[str] = []
    for sequence in sequences:
        for index, event in enumerate(sequence.events):
            events.append(event)
            if sequence.label == SequenceLabel.MALICIOUS:
                first = sequence.first_malicious_index
                labels.append(1 if first is None or index >= first else 0)
            else:
                labels.append(0)
            families.append(sequence.family)
            seq_ids.append(sequence.sequence_id)
    return events, labels, families, seq_ids
