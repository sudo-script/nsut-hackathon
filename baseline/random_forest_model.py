"""Random Forest event-level classifier."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestClassifier


@dataclass
class RandomForestBaseline:
    model: RandomForestClassifier

    @classmethod
    def train(cls, features: np.ndarray, labels: np.ndarray) -> "RandomForestBaseline":
        model = RandomForestClassifier(
            n_estimators=120,
            max_depth=8,
            min_samples_leaf=2,
            n_jobs=1,
            random_state=7,
        )
        model.fit(features, labels)
        return cls(model)

    def predict_proba(self, features: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(features)[:, 1]
