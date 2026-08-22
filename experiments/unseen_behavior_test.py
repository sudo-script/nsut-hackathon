"""Test 2: recall on an attack family held out of training."""

from __future__ import annotations

from collector.schema import Sequence
from evaluation.metrics import classification_report
from experiments.helpers import neuro_score, sequence_ml_score
from pipeline import SecurityPipeline


def run_unseen_behavior_test(
    pipeline: SecurityPipeline,
    test: list[Sequence],
    holdout_family: str,
) -> dict[str, dict[str, float]]:
    holdout = [seq for seq in test if seq.family == holdout_family]
    benign = [seq for seq in test if not seq.is_malicious]
    subset = holdout + benign
    y_true = [1 if seq.is_malicious else 0 for seq in subset]
    ml_scores = [sequence_ml_score(pipeline, seq) for seq in subset]
    ns_scores = [neuro_score(pipeline, seq) for seq in subset]
    return {
        "holdout_family": {"name": holdout_family, "n_malicious": float(len(holdout))},
        "xgboost": classification_report(y_true, ml_scores).as_dict(),
        "neuro_symbolic": classification_report(y_true, ns_scores, threshold=0.35).as_dict(),
    }
