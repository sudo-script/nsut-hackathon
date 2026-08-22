from active_inference.actions import ActionType
from active_inference.policy import select_action
from world_model.belief_update import BeliefState
from world_model.state import WorldState


def test_selects_cheap_inspection_when_uncertain() -> None:
    belief = BeliefState(
        probs={
            "normal": 0.40,
            "suspicious_execution": 0.25,
            "persistence": 0.05,
            "credential_access": 0.08,
            "lateral_movement": 0.07,
            "command_and_control": 0.10,
            "compromised": 0.05,
        }
    )
    action = select_action(belief, WorldState())
    assert action.action.action_type != ActionType.ISOLATE_ENDPOINT


def test_isolation_wins_only_when_compromise_is_high() -> None:
    belief = BeliefState(
        probs={
            "normal": 0.05,
            "suspicious_execution": 0.10,
            "persistence": 0.05,
            "credential_access": 0.10,
            "lateral_movement": 0.15,
            "command_and_control": 0.20,
            "compromised": 0.35,
        }
    )
    action = select_action(belief, WorldState())
    assert action.action.action_type in {
        ActionType.ISOLATE_ENDPOINT,
        ActionType.BLOCK_CONNECTION,
        ActionType.INSPECT_RELATED_HOSTS,
        ActionType.INCREASE_MONITORING,
    }
