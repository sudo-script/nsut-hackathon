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
        for step in result.steps:
            neuro_event_scores.append(1.0 - step.belief.get("normal", 0.0))
    reports["neuro_symbolic"] = classification_report(
        labels, neuro_event_scores, threshold=0.42
    ).as_dict()
    return reports
