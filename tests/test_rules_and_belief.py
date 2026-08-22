from data.generator import family_macro_dropper
from reasoning.rules import evaluate_rules
from world_model.belief_update import BeliefState, update_belief
from world_model.state import WorldState
import random


def test_macro_dropper_fires_execution_and_updates_belief() -> None:
    sequence = family_macro_dropper(random.Random(0), "t-macro", 1_700_000_000.0)
    world = WorldState()
    belief = BeliefState()
    fired = set()
    for event in sequence.events:
        index = world.ingest(event)
        for match in evaluate_rules(world, index):
            fired.add(match.evidence.name)
            world.evidence.append(match.evidence)
            update_belief(belief, match.evidence)
    assert "office_spawns_script" in fired
    assert "credential_tool" in fired or "encoded_or_download" in fired
    assert belief.probs["suspicious_execution"] > belief.probs["normal"] * 0.5
    assert belief.attack_mass > 0.35


def test_backup_context_keeps_normal_belief_high() -> None:
    from data.generator import benign_backup

    sequence = benign_backup(random.Random(1), "t-backup", 1_700_000_000.0)
    world = WorldState()
    belief = BeliefState()
    for event in sequence.events:
        index = world.ingest(event)
        for match in evaluate_rules(world, index):
            world.evidence.append(match.evidence)
            update_belief(belief, match.evidence)
    assert belief.probs["normal"] > 0.55
