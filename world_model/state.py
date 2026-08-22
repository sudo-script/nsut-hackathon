"""Snapshot of the evolving world: graph plus recent evidence."""

from __future__ import annotations

from dataclasses import dataclass, field

from collector.schema import Event
from world_model.graph import EventGraph


ATTACK_STATES = (
    "normal",
    "suspicious_execution",
    "persistence",
    "credential_access",
    "lateral_movement",
    "command_and_control",
    "compromised",
)


@dataclass
class Evidence:
    name: str
    likelihood_ratios: dict[str, float]
    source: str
    event_index: int


@dataclass
class WorldState:
    graph: EventGraph = field(default_factory=EventGraph)
    events: list[Event] = field(default_factory=list)
    evidence: list[Evidence] = field(default_factory=list)
    inspected: set[str] = field(default_factory=set)
    monitoring_boost: float = 0.0

    def ingest(self, event: Event) -> int:
        index = len(self.events)
        self.events.append(event)
        self.graph.ingest(event, index)
        return index
