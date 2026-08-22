"""Lightweight matplotlib helpers for experiment artifacts."""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def bar_compare(path: str | Path, title: str, series: dict[str, float]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    labels = list(series.keys())
    values = [series[label] for label in labels]
    fig, ax = plt.subplots(figsize=(8, 4.2))
    ax.bar(labels, values, color="#2c6e49")
    ax.set_title(title)
    ax.set_ylim(0, max(1.0, max(values) * 1.15) if values else 1.0)
    ax.tick_params(axis="x", rotation=20)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def belief_timeline(path: str | Path, history: list[dict[str, float]]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not history:
        return
    xs = list(range(len(history)))
    fig, ax = plt.subplots(figsize=(8, 4.5))
    for key in history[0]:
        ax.plot(xs, [row[key] for row in history], label=key)
    ax.set_xlabel("Event index")
    ax.set_ylabel("Belief")
    ax.set_title("World-state belief over time")
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
