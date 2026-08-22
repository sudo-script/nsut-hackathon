from baseline.train import train_baselines
from data.generator import generate_dataset
from pipeline import SecurityPipeline


def test_pipeline_detects_macro_family_and_reconstructs_path() -> None:
    dataset = generate_dataset(
        seed=3,
        train_benign=24,
        train_malicious_per_family=8,
        test_benign=8,
        test_malicious_per_family=4,
    )
    pipeline = SecurityPipeline(train_baselines(dataset.train))
    target = next(seq for seq in dataset.test if seq.family == "family_macro_dropper")
    result = pipeline.run_sequence(target)
    assert result.detected
    assert result.world.graph.reconstruct_paths()
    assert result.investigations >= 1
    assert result.predicted_next
