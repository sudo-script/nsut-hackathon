"""Temporal event graph G_t = (V_t, E_t) connecting hosts, users, and artifacts."""

from __future__ import annotations

from dataclasses import dataclass, field

import networkx as nx

from collector.feature_builder import OFFICE_PROCESSES, SCRIPT_INTERPRETERS
from collector.schema import AuthEvent, Event, FileEvent, NetworkEvent, ProcessEvent
from world_model.entities import Entity, EntityType


@dataclass
class Relation:
    source: str
    target: str
    relation: str
    timestamp: float
    evidence_event_index: int


@dataclass
class EventGraph:
    graph: nx.MultiDiGraph = field(default_factory=nx.MultiDiGraph)
    entities: dict[str, Entity] = field(default_factory=dict)
    relations: list[Relation] = field(default_factory=list)
    process_names: dict[str, str] = field(default_factory=dict)
    process_parents: dict[str, str] = field(default_factory=dict)

    def _add_entity(self, entity: Entity) -> str:
        self.entities[entity.entity_id] = entity
        if not self.graph.has_node(entity.entity_id):
            self.graph.add_node(
                entity.entity_id,
                entity_type=entity.entity_type.value,
                name=entity.name,
            )
        return entity.entity_id

    def _link(
        self,
        source: str,
        target: str,
        relation: str,
        timestamp: float,
        index: int,
    ) -> None:
        self.graph.add_edge(source, target, relation=relation, timestamp=timestamp)
        self.relations.append(Relation(source, target, relation, timestamp, index))

    def ingest(self, event: Event, index: int) -> None:
        host_id = f"host:{getattr(event, 'host', 'host-01')}"
        self._add_entity(
            Entity(host_id, EntityType.HOST, getattr(event, "host", "host-01"))
        )
        user_name = getattr(event, "user", None)
        user_id = None
        if user_name:
            user_id = f"user:{user_name}"
            self._add_entity(Entity(user_id, EntityType.USER, user_name))
            self._link(user_id, host_id, "accessed", event.timestamp, index)

        if isinstance(event, ProcessEvent):
            proc_id = f"proc:{event.process_id}"
            self._add_entity(
                Entity(
                    proc_id,
                    EntityType.PROCESS,
                    event.process_name,
                    {"command_line": event.command_line, "user": event.user},
                )
            )
            self.process_names[event.process_id] = event.process_name
            self.process_names[proc_id] = event.process_name
            if event.parent_process_id:
                self.process_parents[event.process_id] = event.parent_process_id
                parent_id = f"proc:{event.parent_process_id}"
                if parent_id not in self.entities:
                    self._add_entity(
                        Entity(parent_id, EntityType.PROCESS, event.parent_process_id)
                    )
                self._link(parent_id, proc_id, "spawned", event.timestamp, index)
            if user_id:
                self._link(user_id, proc_id, "accessed", event.timestamp, index)
            self._link(proc_id, host_id, "accessed", event.timestamp, index)

        elif isinstance(event, FileEvent):
            file_id = f"file:{event.file_path}"
            self._add_entity(
                Entity(
                    file_id,
                    EntityType.FILE,
                    event.file_path,
                    {"hash": event.file_hash},
                )
            )
            proc_id = f"proc:{event.parent_process}"
            if proc_id not in self.entities:
                self._add_entity(Entity(proc_id, EntityType.PROCESS, event.parent_process))
            relation = "created" if event.file_created else "modified"
            if not event.file_created and not event.file_modified:
                relation = "accessed"
            self._link(proc_id, file_id, relation, event.timestamp, index)

        elif isinstance(event, NetworkEvent):
            dest_id = None
            if event.destination_domain:
                dest_id = f"domain:{event.destination_domain.lower()}"
                self._add_entity(
                    Entity(dest_id, EntityType.DOMAIN, event.destination_domain.lower())
                )
            if event.destination_ip:
                ip_id = f"ip:{event.destination_ip}"
                self._add_entity(Entity(ip_id, EntityType.IP, event.destination_ip))
                if dest_id:
                    self._link(dest_id, ip_id, "accessed", event.timestamp, index)
                dest_id = dest_id or ip_id
            proc_id = f"proc:{event.source_process}"
            if proc_id not in self.entities:
                self._add_entity(Entity(proc_id, EntityType.PROCESS, event.source_process))
            if dest_id:
                self._link(proc_id, dest_id, "connected_to", event.timestamp, index)

        elif isinstance(event, AuthEvent):
            src = f"host:{event.source}"
            dst = f"host:{event.destination}"
            self._add_entity(Entity(src, EntityType.HOST, event.source))
            self._add_entity(Entity(dst, EntityType.HOST, event.destination))
            if user_id:
                self._link(user_id, dst, "authenticated_to", event.timestamp, index)
            self._link(src, dst, "authenticated_to", event.timestamp, index)

    def process_name(self, process_key: str) -> str:
        return (
            self.process_names.get(process_key)
            or self.process_names.get(f"proc:{process_key}")
            or process_key
        )

    def parent_is_office(self, process_id: str) -> bool:
        parent = self.process_parents.get(process_id, "")
        parent_name = self.process_name(parent).lower()
        return parent_name in OFFICE_PROCESSES

    def has_office_to_script(self) -> bool:
        for source, target, data in self.graph.edges(data=True):
            if data.get("relation") != "spawned":
                continue
            src_name = str(self.graph.nodes[source].get("name", "")).lower()
            dst_name = str(self.graph.nodes[target].get("name", "")).lower()
            if src_name in OFFICE_PROCESSES and dst_name in SCRIPT_INTERPRETERS:
                return True
        return False

    def connected_destinations(self) -> list[str]:
        destinations = []
        for _, target, data in self.graph.edges(data=True):
            if data.get("relation") == "connected_to":
                destinations.append(str(self.graph.nodes[target].get("name", "")))
        return destinations

    def authenticated_hosts(self) -> list[str]:
        hosts = []
        for _, target, data in self.graph.edges(data=True):
            if data.get("relation") == "authenticated_to":
                hosts.append(target)
        return hosts

    def reconstruct_paths(self, max_hops: int = 5) -> list[list[str]]:
        """Reconstruct short process/network trajectories from the graph."""
        paths: list[list[str]] = []
        process_nodes = [
            node
            for node, attrs in self.graph.nodes(data=True)
            if attrs.get("entity_type") == EntityType.PROCESS.value
        ]
        for source in process_nodes:
            for target in list(self.graph.nodes()):
                if source == target:
                    continue
                try:
                    simple = nx.shortest_path(self.graph, source, target)
                except (nx.NetworkXNoPath, nx.NodeNotFound):
                    continue
                if 2 <= len(simple) <= max_hops + 1:
                    named = [
                        str(self.graph.nodes[node].get("name") or node) for node in simple
                    ]
                    if named not in paths:
                        paths.append(named)
        return paths[:20]
