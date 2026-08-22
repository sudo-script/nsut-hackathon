"""Test 1: standard malware/behavior classification vs ML baselines."""

from __future__ import annotations

from collector.schema import Sequence
from data.loader import flatten_events
from evaluation.metrics import classification_report
from pipeline import SecurityPipeline


def run_classification_test(
    pipeline: SecurityPipeline, test: list[Sequence]
) -> dict[str, dict[str, float]]:
    events, labels, _, _ = flatten_events(test)
    reports: dict[str, dict[str, float]] = {}
    for model in ("xgboost", "random_forest", "neural"):
        scores = pipeline.baselines.risk_scores(events, model)
        reports[model] = classification_report(labels, scores).as_dict()

    neuro_event_scores = []
    for sequence in test:
        result = pipeline.run_sequence(sequence)
        neuro_event_scores.extend([result.belief.attack_mass] * len(sequence.events))
    reports["neuro_symbolic"] = classification_report(
        labels, neuro_event_scores, threshold=0.35
    ).as_dict()
    return reports
