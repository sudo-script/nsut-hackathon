"""Safe, telemetry-oriented investigation actions.

Containment is simulated and never applied to a real host.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ActionType(str, Enum):
    DO_NOTHING = "do_nothing"
    INSPECT_PROCESS_TREE = "inspect_process_tree"
    INSPECT_NETWORK_HISTORY = "inspect_network_history"
    INSPECT_FILE_REPUTATION = "inspect_file_reputation"
    INSPECT_RELATED_HOSTS = "inspect_related_hosts"
    INCREASE_MONITORING = "increase_monitoring"
    BLOCK_CONNECTION = "block_connection_simulated"
    ISOLATE_ENDPOINT = "isolate_endpoint_simulated"


@dataclass(frozen=True)
class Action:
    action_type: ActionType
    description: str
    cost: float
    containment: bool = False


def default_actions() -> list[Action]:
    return [
        Action(ActionType.DO_NOTHING, "Continue observing without extra cost", 0.05),
        Action(
            ActionType.INSPECT_PROCESS_TREE,
            "Inspect parent/child process relationships",
            0.35,
        ),
        Action(
            ActionType.INSPECT_NETWORK_HISTORY,
            "Inspect recent destinations and connection cadence",
            0.40,
        ),
        Action(
            ActionType.INSPECT_FILE_REPUTATION,
            "Inspect file provenance and persistence paths",
            0.45,
        ),
        Action(
            ActionType.INSPECT_RELATED_HOSTS,
            "Inspect authentication edges to related hosts",
            0.70,
        ),
        Action(
            ActionType.INCREASE_MONITORING,
            "Raise collection sensitivity on this host",
            0.55,
        ),
        Action(
            ActionType.BLOCK_CONNECTION,
            "Simulate blocking the current outbound connection",
            1.40,
            containment=True,
        ),
        Action(
            ActionType.ISOLATE_ENDPOINT,
            "Simulate isolating the endpoint in the lab",
            2.20,
            containment=True,
        ),
    ]
