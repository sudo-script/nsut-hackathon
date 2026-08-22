"""Test 4: weak-signal sequences where no single event is strongly malicious."""

from __future__ import annotations

from collector.schema import Sequence
from evaluation.metrics import classification_report
from experiments.helpers import neuro_score, sequence_ml_score
from pipeline import SecurityPipeline


def run_weak_signal_test(
    pipeline: SecurityPipeline, test: list[Sequence]
) -> dict[str, dict[str, float]]:
    weak = [seq for seq in test if seq.family == "family_weak_signal"]
    benign = [seq for seq in test if not seq.is_malicious]
    subset = weak + benign
    y_true = [1 if seq.is_malicious else 0 for seq in subset]
    ml_scores = [sequence_ml_score(pipeline, seq) for seq in subset]
    ns_scores = [neuro_score(pipeline, seq) for seq in subset]
    return {
        "n_weak_attacks": {"count": float(len(weak))},
        "xgboost": classification_report(y_true, ml_scores).as_dict(),
        "neuro_symbolic": classification_report(y_true, ns_scores, threshold=0.30).as_dict(),
    }
