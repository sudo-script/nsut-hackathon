# Neuro-Symbolic World Models and Active Inference for Network Security

V1 endpoint security layer that sits on top of existing telemetry. It does **not** replace antivirus. The same process, file, network, and authentication events feed both a conventional ML baseline and a neuro-symbolic world model that:

1. Scores events with XGBoost, Random Forest, and a small neural net
2. Maintains a temporal graph of hosts, users, processes, files, IPs, and domains
3. Applies behavioral (not signature) symbolic rules
4. Updates a probabilistic belief state over hidden attack stages
5. Chooses the next investigation or simulated containment action with a cheap active-inference score

```text
Process + Network Events
          |
          v
      XGBoost
          |
          +----------------+
          |                |
          v                v
      Risk Score      Event Graph
                           |
                           v
                     21 Symbolic Rules
                           |
                           v
                       Belief State
                           |
                           v
                  Select Next Inspection
```

## Research question

Given identical endpoint telemetry, can a neuro-symbolic world model with active investigation:

- detect multi-stage attacks with fewer observations
- reduce context-dependent false positives
- generalize to held-out behavioral families
- spend fewer expensive investigations
- reconstruct and predict attack trajectories

The claim is **not** “highest malware classification accuracy.” It is that event-level classifiers miss connected trajectories and over-alert on legitimate admin/dev work, while a world model can carry context across time.

## Safety

All datasets are **controlled behavioral simulations**. There is no live malware, no exploit code, and no production telemetry. Containment actions (`block_connection_simulated`, `isolate_endpoint_simulated`) are scored only; they never touch a real host. Do not point this prototype at personal machines, campus networks, or production infrastructure.

## Repository layout

```text
collector/           event schemas, normalizer, shared feature builder
data/                synthetic sequence generator and JSONL loader
baseline/            XGBoost, Random Forest, MLP
world_model/         entities, temporal graph, belief updates
reasoning/           21 behavioral rules and stage inference
active_inference/    action set, Score(a) = IG + risk reduction − cost
experiments/         seven evaluation tests + run_all
evaluation/          metrics and plots
dashboard/           static HTML timeline / world-state view
demo/                interactive lab: dummy campaigns vs XGBoost + world model
tests/               unit and pipeline checks
```

## Quick start

```bash
python -m pip install -r requirements.txt
python -m pytest
python -m experiments.run_all --output data/processed
python -m dashboard.app --results data/processed/results.json
python -m demo.app --port 5050
```

Open `http://127.0.0.1:5050` for the interactive lab. Launch a dummy specimen (recon, footprinting, simulated pentest, data theft, or benign admin). Sliders change stealth, playback speed, and detector thresholds. The map animates host discovery, port probes, and fake file theft while XGBoost and the world model race in real time. Nothing leaves the simulator.

`data/processed/results.json` holds the seven-test comparison. `data/processed/dashboard.html` shows one reconstructed chain:

```text
ATTACK TIMELINE
  Office document → script interpreter → rare external host
  → credential-access indicator → remote authentication

WORLD STATE
  Normal / Suspicious Execution / Credential Access / ...

AGENT DECISION
  inspect_process_tree | inspect_network_history | ...
```

## Telemetry schema

Events follow the V1 plan: process (id, parent, name, command line, user, time), file (hash, path, created/modified, parent process), network (source process, IP/domain, port, frequency), and authentication (user, source, destination, success).

## World model and beliefs

The graph is \(G_t = (V_t, E_t)\) with relations `spawned`, `created`, `connected_to`, `authenticated_to`, `modified`, and `accessed`. Hidden states estimated as \(P(S_t \mid O_{1:t})\):

- Normal
- Suspicious execution
- Persistence
- Credential access
- Lateral movement
- Command and control
- Compromised

Evidence is a likelihood-ratio update. Rules raise attack stages when relationships appear (office → script → rare domain). Context rules *lower* attack belief for developer toolchains, backup jobs, scanners, and known update destinations.

## Active inference (V1 approximation)

Actions: do nothing, inspect process tree, inspect network history, inspect file reputation, inspect related hosts, increase monitoring, plus simulated block/isolate.

\[
a^* = \arg\max_a \big(\mathrm{InformationGain}(a) + \mathrm{RiskReduction}(a) - \mathrm{Cost}(a)\big)
\]

Cheap inspections are preferred while the belief is uncertain; simulated containment is deferred until attack mass is high.

## Experiments

| Test | What it measures |
|---|---|
| 1 Classification | Accuracy, precision, recall, F1, AUROC vs XGBoost / RF / MLP |
| 2 Unseen family | Recall/FPR on `family_beacon`, held out of training |
| 3 Attack chains | Time-to-detection and events-to-detection |
| 4 Weak signals | Detection when each event is only mildly suspicious |
| 5 False positives | Dev, admin scripting, backup, scanning, remote management |
| 6 Investigation | Always-investigate vs active policy (count, CPU, RAM) |
| 7 Trajectories | Top-K next-stage prediction and path reconstruction |

Synthetic families encode behavior, not samples: macro-like document → script → C2 → credential access → lateral movement; LOLBin-like persistence; periodic rare outbound “beacon” behavior; and a weak-signal chain.

## Results on the controlled simulator

Latest `python -m experiments.run_all` run (seed 7). These numbers support the architecture on **simulated** trajectories; they are not a claim about real malware.

| Test | ML baseline (XGBoost) | Neuro-symbolic world model |
|---|---|---|
| 1 Classification F1 | 0.87 | **0.99** |
| 1 False-positive rate | 0.08 | **0.00** |
| 2 Unseen-family F1 (`family_beacon`) | 0.62 | **1.00** |
| 3 Mean events to detection | 1.75 | **1.00** |
| 3 Mean time to detection | 270s | **0s** |
| 4 Weak-signal F1 | 0.62 | **1.00** |
| 5 Contextual benign FPR | 0.37 | **0.00** |
| 6 Deep investigations | 358 | **128** (−64%) |
| 7 Top-3 next-stage accuracy | — | **1.00** |
| 7 Attack-path reconstruction | — | **1.00** |

The world model matches or beats event-level recall, uses context rules to avoid alerting on admin/dev/backup/scan work, connects early behavioral stages before a strong per-event score appears, and investigates only when the policy expects information or risk reduction.

See `docs/neurosymbolic_active_inference_network_security_plan.md` for the full research plan.
