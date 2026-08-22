"""Small multilayer perceptron event-level classifier."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler


@dataclass
class NeuralBaseline:
    scaler: StandardScaler
    model: MLPClassifier

    @classmethod
    def train(cls, features: np.ndarray, labels: np.ndarray) -> "NeuralBaseline":
        scaler = StandardScaler()
        scaled = scaler.fit_transform(features)
        model = MLPClassifier(
            hidden_layer_sizes=(32, 16),
            activation="relu",
            max_iter=400,
            random_state=7,
            early_stopping=True,
            validation_fraction=0.15,
        )
        model.fit(scaled, labels)
        return cls(scaler, model)

    def predict_proba(self, features: np.ndarray) -> np.ndarray:
        scaled = self.scaler.transform(features)
        return self.model.predict_proba(scaled)[:, 1]
