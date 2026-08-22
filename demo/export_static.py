"""Bake detector results into JSON for the static React lab."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from demo.engine import run_demo

SCENARIOS = [
    "full_chain",
    "recon_footprint",
    "pentest_lateral",
    "data_theft",
    "benign_admin",
]
STEALTH = [0, 20, 35, 50, 70, 90]


def main() -> None:
    out = ROOT / "web" / "src" / "data" / "campaigns.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    catalog = []
    for scenario in SCENARIOS:
        for stealth in STEALTH:
            for noise in (False, True):
                payload = run_demo(
                    scenario=scenario,
                    stealth=stealth,
                    noise=noise,
                    ml_threshold=0.5,
                    ns_threshold=0.24,
                )
                catalog.append(
                    {
                        "key": f"{scenario}|{stealth}|{int(noise)}",
                        "scenario": scenario,
                        "stealth": stealth,
                        "noise": noise,
                        "meta": payload["meta"],
                        "frames": payload["frames"],
                        "summary": {
                            "investigations": payload["summary"]["investigations"],
                            "final_impact": payload["summary"]["final_impact"],
                            "paths": payload["summary"]["paths"],
                            "predicted_next": payload["summary"]["predicted_next"],
                        },
                    }
                )
                print("exported", catalog[-1]["key"], flush=True)
    out.write_text(json.dumps({"campaigns": catalog}, separators=(",", ":")))
    print(f"wrote {out} ({len(catalog)} campaigns)")


if __name__ == "__main__":
    main()
