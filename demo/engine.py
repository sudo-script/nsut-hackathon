"""Run a dummy campaign through XGBoost and the neuro-symbolic pipeline."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from baseline.train import train_baselines
from data.generator import generate_dataset
from demo.campaigns import Campaign, build_campaign, campaign_public_meta
from pipeline import SecurityPipeline
from reasoning.attack_inference import predict_next_stages


@lru_cache(maxsize=1)
def get_pipeline() -> SecurityPipeline:
    dataset = generate_dataset()
    return SecurityPipeline(train_baselines(dataset.train), ml_model="xgboost")


def _ns_score(belief: dict[str, float]) -> float:
    return max(
        belief.get("suspicious_execution", 0.0),
        belief.get("persistence", 0.0),
        belief.get("credential_access", 0.0),
        belief.get("lateral_movement", 0.0),
        belief.get("command_and_control", 0.0),
        belief.get("compromised", 0.0),
    )


def run_demo(
    *,
    scenario: str = "full_chain",
    stealth: int = 35,
    noise: bool = False,
    ml_threshold: float = 0.50,
    ns_threshold: float = 0.24,
    seed: int = 11,
) -> dict[str, Any]:
    campaign: Campaign = build_campaign(scenario, stealth, noise, seed=seed)
    pipeline = get_pipeline()
    result = pipeline.run_sequence(campaign.as_sequence())

    totals = {
        "hosts_discovered": 0,
        "services_fingerprinted": 0,
        "ports_probed": 0,
        "files_touched": 0,
        "mb_exfiltrated": 0,
        "credentials_touched": 0,
        "hosts_pivoted": 0,
    }
    frames: list[dict[str, Any]] = []
    ml_detect_at: int | None = None
    ns_detect_at: int | None = None

    for beat, step in zip(campaign.beats, result.steps):
        for key, value in beat.impact.items():
            totals[key] = totals.get(key, 0) + int(value)
        ml_alert = step.ml_risk >= ml_threshold
        ns_alert = _ns_score(step.belief) >= ns_threshold or step.belief.get("compromised", 0) >= 0.20
        if ml_alert and ml_detect_at is None:
            ml_detect_at = step.event_index
        if ns_alert and ns_detect_at is None:
            ns_detect_at = step.event_index
        ev = beat.event
        frames.append(
            {
                "index": step.event_index,
                "stage": beat.stage,
                "title": beat.title,
                "narrative": beat.narrative,
                "source": beat.source,
                "target": beat.target,
                "visual": beat.visual,
                "stolen_name": beat.stolen_name,
                "impact": dict(totals),
                "event_type": type(ev).__name__,
                "ml_risk": round(step.ml_risk, 3),
                "ml_alert": ml_alert,
                "belief": {key: round(val, 3) for key, val in step.belief.items()},
                "ns_score": round(_ns_score(step.belief), 3),
                "ns_alert": ns_alert,
                "rules": [match.title for match in step.fired_rules],
                "action": step.action.action.action_type.value,
                "action_reason": step.action.reason,
                "predicted_next": [
                    {"stage": name, "score": round(score, 3)}
                    for name, score in predict_next_stages(result.belief)
                ]
                if step.event_index == result.steps[-1].event_index
                else [],
            }
        )

    return {
        "meta": campaign_public_meta(campaign),
        "params": {
            "scenario": scenario,
            "stealth": stealth,
            "noise": noise,
            "ml_threshold": ml_threshold,
            "ns_threshold": ns_threshold,
        },
        "frames": frames,
        "summary": {
            "ml_detect_at": ml_detect_at,
            "ns_detect_at": ns_detect_at,
            "ml_won_race": ml_detect_at is not None
            and (ns_detect_at is None or ml_detect_at < ns_detect_at),
            "ns_won_race": ns_detect_at is not None
            and (ml_detect_at is None or ns_detect_at < ml_detect_at),
            "tie": ml_detect_at is not None and ml_detect_at == ns_detect_at,
            "investigations": result.investigations,
            "final_impact": totals,
            "paths": result.world.graph.reconstruct_paths()[:6],
            "predicted_next": [
                {"stage": name, "score": round(score, 3)} for name, score in result.predicted_next
            ],
        },
    }
