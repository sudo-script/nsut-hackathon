"""World-model node types: host, user, process, file, IP, domain, technique."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class EntityType(str, Enum):
    HOST = "host"
    USER = "user"
    PROCESS = "process"
    FILE = "file"
    IP = "ip"
    DOMAIN = "domain"
    ATTACK_TECHNIQUE = "attack_technique"


@dataclass
class Entity:
    entity_id: str
    entity_type: EntityType
    name: str
    attributes: dict[str, Any] = field(default_factory=dict)

    def key(self) -> tuple[str, str]:
        return (self.entity_type.value, self.entity_id)
