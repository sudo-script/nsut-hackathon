"""Train all conventional baselines on identical flattened telemetry."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from baseline.neural_model import NeuralBaseline
from baseline.random_forest_model import RandomForestBaseline
from baseline.xgboost_model import XGBoostBaseline
from collector.feature_builder import FeatureBuilder
from collector.schema import Event, Sequence
from data.loader import flatten_events


@dataclass
class BaselineBundle:
    feature_builder: FeatureBuilder
    xgboost: XGBoostBaseline
    random_forest: RandomForestBaseline
    neural: NeuralBaseline

    def risk_scores(self, events: list[Event], model: str = "xgboost") -> np.ndarray:
        matrix = np.asarray(self.feature_builder.transform(events), dtype=float)
        estimator = {
            "xgboost": self.xgboost,
            "random_forest": self.random_forest,
            "neural": self.neural,
        }[model]
        return estimator.predict_proba(matrix)


def train_baselines(train: list[Sequence]) -> BaselineBundle:
    events, labels, _, _ = flatten_events(train)
    builder = FeatureBuilder().fit(events)
    features = np.asarray(builder.transform(events), dtype=float)
    y = np.asarray(labels, dtype=int)
    return BaselineBundle(
        feature_builder=builder,
        xgboost=XGBoostBaseline.train(features, y),
        random_forest=RandomForestBaseline.train(features, y),
        neural=NeuralBaseline.train(features, y),
    )
