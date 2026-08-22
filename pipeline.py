"""End-to-end V1 pipeline: ML risk + graph + rules + belief + next action."""

from __future__ import annotations

from dataclasses import dataclass, field

from active_inference.action_scoring import ActionScore
from active_inference.actions import ActionType
from active_inference.policy import select_action
from baseline.train import BaselineBundle
from collector.schema import Event, Sequence
from reasoning.attack_inference import AttackHypothesis, infer_attack_hypotheses, predict_next_stages
from reasoning.rules import RuleMatch, evaluate_rules
from world_model.belief_update import BeliefState, belief_from_ml_score, update_belief
from world_model.state import WorldState


@dataclass
class StepResult:
    event_index: int
    ml_risk: float
    fired_rules: list[RuleMatch]
    belief: dict[str, float]
    action: ActionScore
    hypotheses: list[AttackHypothesis]


@dataclass
class PipelineResult:
    sequence_id: str
    steps: list[StepResult] = field(default_factory=list)
    world: WorldState = field(default_factory=WorldState)
    belief: BeliefState = field(default_factory=BeliefState)
    predicted_next: list[tuple[str, float]] = field(default_factory=list)
    investigations: int = 0
    containment_actions: int = 0

    @property
    def final_belief(self) -> dict[str, float]:
        return self.belief.as_dict()

    @property
    def detected(self) -> bool:
        return self.detection_index is not None

    @property
    def detection_index(self) -> int | None:
        for step in self.steps:
            if _is_alert(step.belief, step.ml_risk, neuro=True):
                return step.event_index
        return None


def _is_alert(belief: dict[str, float], ml_risk: float, *, neuro: bool) -> bool:
    if neuro:
        attack_states = [
            belief.get("suspicious_execution", 0.0),
            belief.get("persistence", 0.0),
            belief.get("credential_access", 0.0),
            belief.get("lateral_movement", 0.0),
            belief.get("command_and_control", 0.0),
            belief.get("compromised", 0.0),
        ]
        return max(attack_states) >= 0.28 or belief.get("compromised", 0.0) >= 0.22
    return ml_risk >= 0.50


class SecurityPipeline:
    """Neuro-symbolic detector that maintains a world model over a sequence."""

    def __init__(self, baselines: BaselineBundle, ml_model: str = "xgboost") -> None:
        self.baselines = baselines
        self.ml_model = ml_model

    def run_sequence(self, sequence: Sequence) -> PipelineResult:
        result = PipelineResult(sequence_id=sequence.sequence_id)
        for event in sequence.events:
            self._step(result, event)
        result.predicted_next = predict_next_stages(result.belief)
        return result

    def _step(self, result: PipelineResult, event: Event) -> StepResult:
        index = result.world.ingest(event)
        ml_risk = float(self.baselines.risk_scores([event], self.ml_model)[0])
        update_belief(result.belief, belief_from_ml_score(ml_risk, index))

        matches = evaluate_rules(result.world, index)
        for match in matches:
            result.world.evidence.append(match.evidence)
            update_belief(result.belief, match.evidence)

        action = select_action(result.belief, result.world)
        if action.action.action_type != ActionType.DO_NOTHING:
            result.world.inspected.add(action.action.action_type.value)
            result.investigations += 1
        if action.action.containment:
            result.containment_actions += 1
        if action.action.action_type == ActionType.INCREASE_MONITORING:
            result.world.monitoring_boost += 0.1

        hypotheses = infer_attack_hypotheses(
            result.belief, matches, result.world.graph, top_k=3
        )
        step = StepResult(
            event_index=index,
            ml_risk=ml_risk,
            fired_rules=matches,
            belief=result.belief.as_dict(),
            action=action,
            hypotheses=hypotheses,
        )
        result.steps.append(step)
        return step


def baseline_detection_index(risks: list[float], threshold: float = 0.50) -> int | None:
    for index, risk in enumerate(risks):
        if risk >= threshold:
            return index
    return None
