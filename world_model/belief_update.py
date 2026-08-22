"""Probabilistic belief state P(S_t | O_1:t) over hidden attack stages."""

from __future__ import annotations

from dataclasses import dataclass, field

from world_model.state import ATTACK_STATES, Evidence


def _normalize(values: dict[str, float]) -> dict[str, float]:
    total = sum(max(v, 1e-9) for v in values.values())
    return {key: max(values[key], 1e-9) / total for key in values}


DEFAULT_PRIOR = {
    "normal": 0.70,
    "suspicious_execution": 0.12,
    "persistence": 0.04,
    "credential_access": 0.04,
    "lateral_movement": 0.03,
    "command_and_control": 0.04,
    "compromised": 0.03,
}


@dataclass
class BeliefState:
    probs: dict[str, float] = field(default_factory=lambda: dict(DEFAULT_PRIOR))
    history: list[dict[str, float]] = field(default_factory=list)

    def as_dict(self) -> dict[str, float]:
        return dict(self.probs)

    @property
    def attack_mass(self) -> float:
        return 1.0 - self.probs.get("normal", 0.0)

    @property
    def dominant_state(self) -> str:
        return max(self.probs, key=self.probs.get)

    def entropy(self) -> float:
        import math

        return -sum(p * math.log2(p) for p in self.probs.values() if p > 0)

    def snapshot(self) -> None:
        self.history.append(self.as_dict())


def update_belief(belief: BeliefState, evidence: Evidence) -> BeliefState:
    """Likelihood-ratio update, then lift compromised if several stages rise."""
    updated = {
        state: belief.probs.get(state, 1e-9) * evidence.likelihood_ratios.get(state, 1.0)
        for state in ATTACK_STATES
    }
    updated = _normalize(updated)

    elevated = [
        state
        for state, value in updated.items()
        if state not in {"normal", "compromised"} and value >= 0.18
    ]
    if len(elevated) >= 2:
        updated["compromised"] = min(0.95, updated["compromised"] + 0.12 * len(elevated))
        updated = _normalize(updated)

    belief.probs = updated
    belief.snapshot()
    return belief


def belief_from_ml_score(score: float, event_index: int) -> Evidence:
    """Map a conventional P(malicious|x) into a soft belief update."""
    # Keep ML evidence relatively weak so context can still overrule it.
    mal = 0.6 + 0.8 * score
    ben = 1.4 - 0.8 * score
    return Evidence(
        name="ml_risk",
        likelihood_ratios={
            "normal": ben,
            "suspicious_execution": mal,
            "persistence": 0.9 + 0.2 * score,
            "credential_access": 0.9 + 0.2 * score,
            "lateral_movement": 0.9 + 0.15 * score,
            "command_and_control": 0.9 + 0.25 * score,
            "compromised": 0.85 + 0.3 * score,
        },
        source="ml",
        event_index=event_index,
    )
