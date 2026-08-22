"""Render a standalone HTML dashboard from experiment results."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Security World Model</title>
  <style>
    :root {{ color-scheme: dark; }}
    body {{ font-family: Inter, system-ui, sans-serif; margin: 0; background: #0f1412; color: #e8efe9; }}
    main {{ max-width: 1100px; margin: 0 auto; padding: 32px 20px 64px; }}
    h1, h2 {{ color: #b7e4c7; }}
    .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
    .card {{ background: #18201c; border: 1px solid #2d6a4f; border-radius: 12px; padding: 16px 18px; }}
    .bar {{ background: #1b4332; height: 10px; border-radius: 99px; overflow: hidden; }}
    .bar > span {{ display: block; height: 100%; background: #52b788; }}
    .muted {{ color: #95d5b2; font-size: 0.92rem; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ text-align: left; padding: 6px 8px; border-bottom: 1px solid #244c38; font-size: 0.92rem; }}
    code {{ color: #d8f3dc; }}
  </style>
</head>
<body>
<main>
  <h1>Neuro-symbolic security world model</h1>
  <p class="muted">V1 endpoint layer: ML perception, temporal graph, symbolic rules, belief state, active investigation.</p>

  <div class="grid">
    <section class="card">
      <h2>World state</h2>
      {belief_rows}
    </section>
    <section class="card">
      <h2>Agent decision</h2>
      <p><strong>{last_action}</strong></p>
      <p class="muted">{last_reason}</p>
      <p>Next-stage predictions: {predictions}</p>
    </section>
  </div>

  <section class="card" style="margin-top:16px">
    <h2>Attack timeline</h2>
    <table>
      <tr><th>t</th><th>Event</th><th>ML risk</th><th>Rules</th><th>Action</th></tr>
      {timeline_rows}
    </table>
  </section>

  <section class="card" style="margin-top:16px">
    <h2>Experiment summary</h2>
    <pre>{summary}</pre>
  </section>
</main>
</body>
</html>
"""


def _bar(label: str, value: float) -> str:
    pct = max(0.0, min(value, 1.0)) * 100.0
    return (
        f"<p>{label}<br/><div class='bar'><span style='width:{pct:.1f}%'></span></div>"
        f"<span class='muted'>{value:.0%}</span></p>"
    )


def render(results: dict) -> str:
    demo = results.get("demo") or {}
    belief = demo.get("final_belief") or {}
    belief_rows = "\n".join(_bar(key.replace("_", " ").title(), value) for key, value in belief.items())
    events = demo.get("events") or []
    last = events[-1] if events else {}
    timeline_rows = "\n".join(
        (
            f"<tr><td>{item['index']}</td><td>{item['type']}</td>"
            f"<td>{item['ml_risk']:.2f}</td><td>{', '.join(item['rules']) or '—'}</td>"
            f"<td><code>{item['action']}</code></td></tr>"
        )
        for item in events
    )
    summary = json.dumps(
        {key: value for key, value in results.items() if key != "demo"},
        indent=2,
    )
    predictions = ", ".join(
        f"{name} ({score:.2f})" for name, score in demo.get("predicted_next") or []
    ) or "—"
    return TEMPLATE.format(
        belief_rows=belief_rows or "<p class='muted'>No demo sequence.</p>",
        last_action=last.get("action", "do_nothing"),
        last_reason=last.get("reason", ""),
        predictions=predictions,
        timeline_rows=timeline_rows,
        summary=summary,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--results", default="data/processed/results.json")
    parser.add_argument("--output", default="data/processed/dashboard.html")
    args = parser.parse_args()
    results = json.loads(Path(args.results).read_text())
    Path(args.output).write_text(render(results), encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
