"""Test 6: always-investigate vs active-inference investigation policy."""

from __future__ import annotations

import time
import tracemalloc

from collector.schema import Sequence
from pipeline import SecurityPipeline


def run_investigation_efficiency_test(
    pipeline: SecurityPipeline, test: list[Sequence]
) -> dict[str, float]:
    """System A inspects every event above a modest ML threshold.

    System B uses the active-inference policy already inside SecurityPipeline.
    """
    system_a_investigations = 0
    system_b_investigations = 0
    system_a_alerts = 0
    system_b_alerts = 0

    tracemalloc.start()
    started = time.perf_counter()
    peak_before = tracemalloc.get_traced_memory()[1]

    for sequence in test:
        scores = [
            float(x)
            for x in pipeline.baselines.risk_scores(list(sequence.events), "xgboost")
        ]
        for score in scores:
            if score >= 0.30:
                system_a_investigations += 1
        if max(scores) >= 0.50:
            system_a_alerts += 1

        result = pipeline.run_sequence(sequence)
        system_b_investigations += result.investigations
        if result.detected:
            system_b_alerts += 1

    elapsed = time.perf_counter() - started
    peak_after = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()

    n = max(len(test), 1)
    return {
        "n_sequences": float(len(test)),
        "system_a_investigations": float(system_a_investigations),
        "system_b_investigations": float(system_b_investigations),
        "system_a_alerts": float(system_a_alerts),
        "system_b_alerts": float(system_b_alerts),
        "system_a_alert_rate": system_a_alerts / n,
        "system_b_alert_rate": system_b_alerts / n,
        "investigation_reduction": (
            1.0 - (system_b_investigations / max(system_a_investigations, 1))
        ),
        "cpu_seconds": elapsed,
        "peak_ram_kb": max(peak_after - peak_before, 0) / 1024.0,
    }
