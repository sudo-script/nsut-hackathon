from demo.campaigns import build_campaign
from demo.engine import run_demo


def test_full_chain_campaign_has_theft_and_recon() -> None:
    campaign = build_campaign("full_chain", stealth=20, noise=False, seed=1)
    stages = [beat.stage for beat in campaign.beats]
    assert "recon" in stages
    assert "footprint" in stages
    assert "exfil" in stages
    assert any(beat.stolen_name for beat in campaign.beats)


def test_run_demo_returns_detector_frames() -> None:
    payload = run_demo(scenario="data_theft", stealth=30, noise=False)
    assert payload["frames"]
    assert "ml_risk" in payload["frames"][0]
    assert "belief" in payload["frames"][0]
    assert payload["summary"]["final_impact"]["mb_exfiltrated"] > 0
