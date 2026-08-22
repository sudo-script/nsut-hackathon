"""Train baselines, run all seven experiments, and write artifacts."""

from __future__ import annotations

import argparse
import json
import resource
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from baseline.train import train_baselines
from data.generator import generate_dataset
from data.loader import save_sequences
from evaluation.plots import bar_compare, belief_timeline
from experiments.attack_chain_test import run_attack_chain_test
from experiments.classification_test import run_classification_test
from experiments.false_positive_test import run_false_positive_test
from experiments.investigation_efficiency_test import run_investigation_efficiency_test
from experiments.trajectory_prediction_test import run_trajectory_prediction_test
from experiments.unseen_behavior_test import run_unseen_behavior_test
from experiments.weak_signal_test import run_weak_signal_test
from pipeline import SecurityPipeline


def _json_default(value):
    if isinstance(value, Path):
        return str(value)
    return str(value)


def run_all(output_dir: str | Path = "data/processed") -> dict:
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    dataset = generate_dataset()
    save_sequences(dataset.train, output / "train.jsonl")
    save_sequences(dataset.test, output / "test.jsonl")

    baselines = train_baselines(dataset.train)
    pipeline = SecurityPipeline(baselines, ml_model="xgboost")

    results = {
        "holdout_family": dataset.holdout_family,
        "n_train": len(dataset.train),
        "n_test": len(dataset.test),
        "test_1_classification": run_classification_test(pipeline, dataset.test),
        "test_2_unseen_behavior": run_unseen_behavior_test(
            pipeline, dataset.test, dataset.holdout_family
        ),
        "test_3_attack_chain": run_attack_chain_test(pipeline, dataset.test),
        "test_4_weak_signal": run_weak_signal_test(pipeline, dataset.test),
        "test_5_false_positives": run_false_positive_test(pipeline, dataset.test),
        "test_6_investigation_efficiency": run_investigation_efficiency_test(
            pipeline, dataset.test
        ),
        "test_7_trajectory_prediction": run_trajectory_prediction_test(
            pipeline, dataset.test
        ),
    }

    # Representative timeline for the dashboard.
    demo = next(
        seq
        for seq in dataset.test
        if seq.family == "family_macro_dropper"
    )
    demo_result = pipeline.run_sequence(demo)
    results["demo"] = {
        "sequence_id": demo.sequence_id,
        "family": demo.family,
        "events": [
            {
                "index": step.event_index,
                "type": type(demo.events[step.event_index]).__name__,
                "ml_risk": round(step.ml_risk, 3),
                "rules": [match.title for match in step.fired_rules],
                "action": step.action.action.action_type.value,
                "reason": step.action.reason,
                "belief": {k: round(v, 3) for k, v in step.belief.items()},
            }
            for step in demo_result.steps
        ],
        "final_belief": {k: round(v, 3) for k, v in demo_result.final_belief.items()},
        "predicted_next": demo_result.predicted_next,
        "paths": demo_result.world.graph.reconstruct_paths()[:5],
    }

    usage = resource.getrusage(resource.RUSAGE_SELF)
    results["resource_usage"] = {
        "user_cpu_seconds": usage.ru_utime,
        "max_rss_mb": usage.ru_maxrss / 1024.0,
    }

    (output / "results.json").write_text(json.dumps(results, indent=2, default=_json_default))

    cls = results["test_1_classification"]
    bar_compare(
        output / "classification_f1.png",
        "Event/sequence F1 by detector",
        {name: values["f1"] for name, values in cls.items()},
    )
    chain = results["test_3_attack_chain"]
    bar_compare(
        output / "events_to_detect.png",
        "Mean events to detection (lower is better)",
        {
            "XGBoost": chain["ml_mean_events_to_detect"],
            "Neuro-symbolic": chain["neuro_mean_events_to_detect"],
        },
    )
    belief_timeline(output / "belief_timeline.png", demo_result.belief.history)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Run V1 security-world-model experiments")
    parser.add_argument("--output", default="data/processed")
    args = parser.parse_args()
    results = run_all(args.output)
    print(json.dumps({k: v for k, v in results.items() if k != "demo"}, indent=2))


if __name__ == "__main__":
    main()
