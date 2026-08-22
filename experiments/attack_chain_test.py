"""Test 3: multi-stage attack-chain detection latency and events-to-detect."""

from __future__ import annotations

import statistics

from collector.schema import Sequence
from evaluation.metrics import detection_latency
from experiments.helpers import ml_detection_index
from pipeline import SecurityPipeline


def _mean(values: list[float]) -> float:
    return float(statistics.mean(values)) if values else 0.0


def run_attack_chain_test(
    pipeline: SecurityPipeline, test: list[Sequence]
) -> dict[str, float]:
    attacks = [
        seq
        for seq in test
        if seq.is_malicious and seq.family != "family_weak_signal"
    ]
    ml_ttd: list[float] = []
    ns_ttd: list[float] = []
    ml_events: list[float] = []
    ns_events: list[float] = []
    ml_detected = 0
    ns_detected = 0

    for sequence in attacks:
        timestamps = [event.timestamp for event in sequence.events]
        ml_idx = ml_detection_index(pipeline, sequence)
        result = pipeline.run_sequence(sequence)
        ns_idx = result.detection_index
        ml = detection_latency(sequence.first_malicious_index, ml_idx, timestamps)
        ns = detection_latency(sequence.first_malicious_index, ns_idx, timestamps)
        if ml["detected"]:
            ml_detected += 1
            ml_ttd.append(float(ml["ttd_seconds"] or 0.0))
            ml_events.append(float(ml["events_to_detection"] or 0.0))
        if ns["detected"]:
            ns_detected += 1
            ns_ttd.append(float(ns["ttd_seconds"] or 0.0))
            ns_events.append(float(ns["events_to_detection"] or 0.0))

    n = max(len(attacks), 1)
    return {
        "n_chains": float(len(attacks)),
        "ml_recall": ml_detected / n,
        "neuro_recall": ns_detected / n,
        "ml_mean_ttd_seconds": _mean(ml_ttd),
        "neuro_mean_ttd_seconds": _mean(ns_ttd),
        "ml_mean_events_to_detect": _mean(ml_events),
        "neuro_mean_events_to_detect": _mean(ns_events),
    }
