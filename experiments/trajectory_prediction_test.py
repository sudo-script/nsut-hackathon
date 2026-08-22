"""Test 7: top-k next-stage prediction after observing early chain events."""

from __future__ import annotations

from collector.schema import Sequence
from pipeline import SecurityPipeline
from reasoning.attack_inference import predict_next_stages
from reasoning.rules import evaluate_rules
from world_model.belief_update import BeliefState, belief_from_ml_score, update_belief
from world_model.state import WorldState


STAGE_ALIASES = {
    "execution": "suspicious_execution",
    "suspicious_script": "suspicious_execution",
    "c2": "command_and_control",
    "command_and_control": "command_and_control",
    "credential_access": "credential_access",
    "persistence": "persistence",
    "lateral_movement": "lateral_movement",
}


def _partial_belief(pipeline: SecurityPipeline, sequence: Sequence, prefix: int) -> BeliefState:
    world = WorldState()
    belief = BeliefState()
    for event in sequence.events[:prefix]:
        index = world.ingest(event)
        risk = float(pipeline.baselines.risk_scores([event], pipeline.ml_model)[0])
        update_belief(belief, belief_from_ml_score(risk, index))
        for match in evaluate_rules(world, index):
            world.evidence.append(match.evidence)
            update_belief(belief, match.evidence)
    return belief


def run_trajectory_prediction_test(
    pipeline: SecurityPipeline, test: list[Sequence], k: int = 3
) -> dict[str, float]:
    attacks = [seq for seq in test if seq.is_malicious and seq.metadata.get("stages")]
    hits = 0
    total = 0
    path_hits = 0
    for sequence in attacks:
        stages = [STAGE_ALIASES.get(s, s) for s in sequence.metadata["stages"]]
        if len(stages) < 2:
            continue
        prefix = max(2, len(sequence.events) // 2)
        belief = _partial_belief(pipeline, sequence, prefix)
        predicted = [name for name, _ in predict_next_stages(belief, k=k)]
        remaining = stages[1:]
        total += 1
        if any(stage in predicted for stage in remaining):
            hits += 1
        result = pipeline.run_sequence(sequence)
        paths = result.world.graph.reconstruct_paths()
        if paths:
            path_hits += 1

    n = max(total, 1)
    return {
        "n_sequences": float(total),
        "top_k": float(k),
        "top_k_accuracy": hits / n,
        "attack_path_reconstruction_rate": path_hits / max(len(attacks), 1),
    }
