"""Shared experiment helpers."""

from __future__ import annotations

from collector.schema import Sequence
from pipeline import SecurityPipeline, baseline_detection_index
from world_model.belief_update import BeliefState


def neuro_score(pipeline: SecurityPipeline, sequence: Sequence) -> float:
    result = pipeline.run_sequence(sequence)
    return result.belief.attack_mass


def neuro_alert(belief: BeliefState) -> bool:
    probs = belief.probs
    attack = max(
        probs.get("suspicious_execution", 0.0),
        probs.get("persistence", 0.0),
        probs.get("credential_access", 0.0),
        probs.get("lateral_movement", 0.0),
        probs.get("command_and_control", 0.0),
        probs.get("compromised", 0.0),
    )
    return attack >= 0.24 or probs.get("compromised", 0.0) >= 0.20


def sequence_ml_score(pipeline: SecurityPipeline, sequence: Sequence) -> float:
    scores = pipeline.baselines.risk_scores(list(sequence.events), pipeline.ml_model)
    return float(max(scores))


def ml_detection_index(pipeline: SecurityPipeline, sequence: Sequence) -> int | None:
    scores = [
        float(x)
        for x in pipeline.baselines.risk_scores(list(sequence.events), pipeline.ml_model)
    ]
    return baseline_detection_index(scores)
