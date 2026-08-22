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
                     19 Symbolic Rules
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
reasoning/           19 behavioral rules and stage inference
active_inference/    action set, Score(a) = IG + risk reduction − cost
experiments/         seven evaluation tests + run_all
evaluation/          metrics and plots
dashboard/           static HTML timeline / world-state view
tests/               unit and pipeline checks
```

## Quick start

```bash
python -m pip install -r requirements.txt
python -m pytest
python -m experiments.run_all --output data/processed
python -m dashboard.app --results data/processed/results.json
```

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

## Success criteria (V1)

The prototype is successful if, on this controlled corpus, it shows competitive recall versus the ML baseline, lower false positives on contextual benign work, fewer events to detect multi-stage chains, fewer deep investigations, a reconstructable attack graph, and non-trivial next-stage prediction.

See `docs/neurosymbolic_active_inference_network_security_plan.md` for the full research plan.
