"""Local simulation-lab server. Binds to localhost only."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from flask import Flask, jsonify, request, send_from_directory

from demo.engine import get_pipeline, run_demo

STATIC = Path(__file__).resolve().parent / "static"
app = Flask(__name__, static_folder=str(STATIC), static_url_path="/static")


@app.get("/")
def index():
    return send_from_directory(STATIC, "index.html")


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "lab": "simulation-only"})


@app.post("/api/run")
def api_run():
    body = request.get_json(force=True, silent=True) or {}
    scenario = str(body.get("scenario") or "full_chain")
    stealth = int(body.get("stealth") or 35)
    noise = bool(body.get("noise"))
    ml_threshold = float(body.get("ml_threshold") or 0.50)
    ns_threshold = float(body.get("ns_threshold") or 0.24)
    payload = run_demo(
        scenario=scenario,
        stealth=stealth,
        noise=noise,
        ml_threshold=ml_threshold,
        ns_threshold=ns_threshold,
    )
    return jsonify(payload)


def main() -> None:
    parser = argparse.ArgumentParser(description="Interactive dummy-campaign lab")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5050)
    args = parser.parse_args()
    get_pipeline()
    print(f"Simulation lab: http://{args.host}:{args.port}  (dummy traffic only)")
    app.run(host=args.host, port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
