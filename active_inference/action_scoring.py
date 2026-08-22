"""Score(a) = InformationGain(a) + RiskReduction(a) - ActionCost(a)."""

from __future__ import annotations

from dataclasses import dataclass

from active_inference.actions import Action, ActionType
from world_model.belief_update import BeliefState
from world_model.state import WorldState


@dataclass
class ActionScore:
    action: Action
    information_gain: float
    risk_reduction: float
    cost: float
    total: float
    reason: str


def _uncertainty(belief: BeliefState) -> float:
    # High entropy and mid-range attack mass are both uncertain.
    mass = belief.attack_mass
    return belief.entropy() / 3.0 + (1.0 - abs(2.0 * mass - 1.0))


def score_action(action: Action, belief: BeliefState, state: WorldState) -> ActionScore:
    uncertainty = _uncertainty(belief)
    attack = belief.attack_mass
    inspected = state.inspected
    already = action.action_type.value in inspected

    info = 0.0
    risk = 0.0
    reason = "Default observation"

    if action.action_type == ActionType.DO_NOTHING:
        info = 0.05
        risk = 0.0
        reason = "No extra telemetry; lowest operational cost"
    elif action.action_type == ActionType.INSPECT_PROCESS_TREE:
        info = 0.85 * uncertainty
        risk = 0.15 * attack
        reason = "Process-tree edges often confirm office-to-script execution"
    elif action.action_type == ActionType.INSPECT_NETWORK_HISTORY:
        info = 0.80 * uncertainty + 0.15 * belief.probs.get("command_and_control", 0)
        risk = 0.20 * attack
        reason = "Network history can confirm rare destinations or beaconing"
    elif action.action_type == ActionType.INSPECT_FILE_REPUTATION:
        info = 0.70 * uncertainty + 0.20 * belief.probs.get("persistence", 0)
        risk = 0.15 * attack
        reason = "File provenance distinguishes temp droppers from user documents"
    elif action.action_type == ActionType.INSPECT_RELATED_HOSTS:
        info = 0.75 * uncertainty + 0.25 * belief.probs.get("lateral_movement", 0)
        risk = 0.25 * attack
        reason = "Related-host auth edges test lateral-movement hypotheses"
    elif action.action_type == ActionType.INCREASE_MONITORING:
        info = 0.45 * uncertainty
        risk = 0.20 * attack
        reason = "Higher-fidelity telemetry at moderate ongoing cost"
    elif action.action_type == ActionType.BLOCK_CONNECTION:
        info = 0.05
        risk = 0.70 * belief.probs.get("command_and_control", 0) + 0.25 * attack
        reason = "Simulated block reduces C2 risk after the destination is known"
    else:  # isolate
        info = 0.02
        risk = 0.90 * attack
        reason = "Simulated isolation is expensive and reserved for high belief"

    if already and action.action_type != ActionType.DO_NOTHING:
        info *= 0.25
        reason += " (already inspected; diminishing returns)"

    # Do not escalate to containment while beliefs are still ambiguous.
    if action.containment and attack < 0.55:
        risk *= 0.25
        reason += "; containment deferred until attack belief is high"

    total = info + risk - action.cost
    return ActionScore(action, info, risk, action.cost, total, reason)
