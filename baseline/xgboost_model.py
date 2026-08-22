"""XGBoost event-level classifier: P(malicious | features)."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from xgboost import XGBClassifier


@dataclass
class XGBoostBaseline:
    model: XGBClassifier

    @classmethod
    def train(cls, features: np.ndarray, labels: np.ndarray) -> "XGBoostBaseline":
        model = XGBClassifier(
            n_estimators=80,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            n_jobs=1,
            random_state=7,
        )
        model.fit(features, labels)
        return cls(model)

    def predict_proba(self, features: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(features)[:, 1]
