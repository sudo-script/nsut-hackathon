"""Select a* = argmax Score(a) over the safe action set."""

from __future__ import annotations

from active_inference.action_scoring import ActionScore, score_action
from active_inference.actions import Action, default_actions
from world_model.belief_update import BeliefState
from world_model.state import WorldState


def rank_actions(
    belief: BeliefState,
    state: WorldState,
    actions: list[Action] | None = None,
) -> list[ActionScore]:
    pool = actions or default_actions()
    ranked = [score_action(action, belief, state) for action in pool]
    ranked.sort(key=lambda item: item.total, reverse=True)
    return ranked


def select_action(
    belief: BeliefState,
    state: WorldState,
    actions: list[Action] | None = None,
) -> ActionScore:
    return rank_actions(belief, state, actions)[0]
