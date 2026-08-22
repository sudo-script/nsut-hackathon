"""Turn rule matches and the event graph into attack-stage hypotheses."""

from __future__ import annotations

from dataclasses import dataclass

from reasoning.rules import RuleMatch
from world_model.belief_update import BeliefState
from world_model.graph import EventGraph


STAGE_ORDER = [
    "suspicious_execution",
    "persistence",
    "command_and_control",
    "credential_access",
    "lateral_movement",
    "compromised",
]


@dataclass
class AttackHypothesis:
    stage: str
    probability: float
    supporting_rules: list[str]
    reconstructed_path: list[str]


def infer_attack_hypotheses(
    belief: BeliefState,
    matches: list[RuleMatch],
    graph: EventGraph,
    top_k: int = 3,
) -> list[AttackHypothesis]:
    support: dict[str, list[str]] = {stage: [] for stage in STAGE_ORDER}
    for match in matches:
        ratios = match.evidence.likelihood_ratios
        attack_keys = [k for k, v in ratios.items() if k != "normal" and v > 1.2]
        for stage in attack_keys:
            if stage in support:
                support[stage].append(match.rule_id)

    paths = graph.reconstruct_paths()
    primary_path = paths[0] if paths else []
    ranked = sorted(
        STAGE_ORDER,
        key=lambda stage: belief.probs.get(stage, 0.0),
        reverse=True,
    )
    hypotheses = []
    for stage in ranked[:top_k]:
        hypotheses.append(
            AttackHypothesis(
                stage=stage,
                probability=belief.probs.get(stage, 0.0),
                supporting_rules=support.get(stage, []),
                reconstructed_path=primary_path,
            )
        )
    return hypotheses


def predict_next_stages(belief: BeliefState, k: int = 3) -> list[tuple[str, float]]:
    """Predict likely unseen next stages from a simple transition prior."""
    transitions = {
        "normal": ["suspicious_execution"],
        "suspicious_execution": ["command_and_control", "persistence", "credential_access"],
        "persistence": ["command_and_control", "compromised"],
        "command_and_control": ["credential_access", "lateral_movement", "persistence"],
        "credential_access": ["lateral_movement", "compromised"],
        "lateral_movement": ["compromised", "credential_access"],
        "compromised": ["lateral_movement", "command_and_control"],
    }
    scores: dict[str, float] = {}
    for stage, prob in belief.probs.items():
        for nxt in transitions.get(stage, []):
            scores[nxt] = scores.get(nxt, 0.0) + prob
    # Prefer stages that are not already dominant.
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return ranked[:k]
