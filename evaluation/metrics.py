"""Precision, recall, F1, AUROC, latency, and investigation counters."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


@dataclass
class ClassificationReport:
    accuracy: float
    precision: float
    recall: float
    f1: float
    auroc: float
    false_positive_rate: float
    extra: dict[str, float] = field(default_factory=dict)

    def as_dict(self) -> dict[str, float]:
        payload = {
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1": self.f1,
            "auroc": self.auroc,
            "false_positive_rate": self.false_positive_rate,
        }
        payload.update(self.extra)
        return {key: round(float(value), 4) for key, value in payload.items()}


def _safe_auc(y_true: np.ndarray, y_score: np.ndarray) -> float:
    if len(np.unique(y_true)) < 2:
        return 0.0
    return float(roc_auc_score(y_true, y_score))


def classification_report(
    y_true: list[int] | np.ndarray,
    y_score: list[float] | np.ndarray,
    threshold: float = 0.5,
) -> ClassificationReport:
    y_true_arr = np.asarray(y_true, dtype=int)
    y_score_arr = np.asarray(y_score, dtype=float)
    y_pred = (y_score_arr >= threshold).astype(int)
    negatives = y_true_arr == 0
    fpr = (
        float(((y_pred == 1) & negatives).sum() / negatives.sum())
        if negatives.any()
        else 0.0
    )
    return ClassificationReport(
        accuracy=float(accuracy_score(y_true_arr, y_pred)),
        precision=float(precision_score(y_true_arr, y_pred, zero_division=0)),
        recall=float(recall_score(y_true_arr, y_pred, zero_division=0)),
        f1=float(f1_score(y_true_arr, y_pred, zero_division=0)),
        auroc=_safe_auc(y_true_arr, y_score_arr),
        false_positive_rate=fpr,
    )


def detection_latency(
    first_malicious_index: int | None,
    detection_index: int | None,
    timestamps: list[float],
) -> dict[str, float | None]:
    if first_malicious_index is None or detection_index is None:
        return {"ttd_seconds": None, "events_to_detection": None, "detected": 0.0}
    if detection_index < first_malicious_index:
        events = 1.0
        ttd = 0.0
    else:
        events = float(detection_index - first_malicious_index + 1)
        ttd = float(timestamps[detection_index] - timestamps[first_malicious_index])
    return {"ttd_seconds": ttd, "events_to_detection": events, "detected": 1.0}
