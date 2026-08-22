"""Test 5: false-positive reduction on legitimate but suspicious workloads."""

from __future__ import annotations

from collector.schema import Sequence
from pipeline import SecurityPipeline


CONTEXT_FAMILIES = {
    "software_development",
    "admin_powershell",
    "backup_job",
    "vulnerability_scan",
    "remote_management",
}


def run_false_positive_test(
    pipeline: SecurityPipeline, test: list[Sequence]
) -> dict[str, float]:
    contextual = [seq for seq in test if seq.family in CONTEXT_FAMILIES]
    attacks = [seq for seq in test if seq.is_malicious]
    ml_fp = 0
    ns_fp = 0
    ml_tp = 0
    ns_tp = 0

    for sequence in contextual:
        ml = float(max(pipeline.baselines.risk_scores(list(sequence.events), "xgboost")))
        result = pipeline.run_sequence(sequence)
        if ml >= 0.50:
            ml_fp += 1
        if result.belief.attack_mass >= 0.45:
            ns_fp += 1

    for sequence in attacks:
        ml = float(max(pipeline.baselines.risk_scores(list(sequence.events), "xgboost")))
        result = pipeline.run_sequence(sequence)
        if ml >= 0.50:
            ml_tp += 1
        if result.detected:
            ns_tp += 1

    n_benign = max(len(contextual), 1)
    n_attack = max(len(attacks), 1)
    return {
        "n_contextual_benign": float(len(contextual)),
        "ml_false_positive_rate": ml_fp / n_benign,
        "neuro_false_positive_rate": ns_fp / n_benign,
        "ml_attack_recall": ml_tp / n_attack,
        "neuro_attack_recall": ns_tp / n_attack,
    }
