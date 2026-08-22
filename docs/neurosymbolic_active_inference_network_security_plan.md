# Neuro-Symbolic World Models and Active Inference for Network Security

## 1. Project Goal

Build a first-version endpoint security layer that combines:

- Machine learning for perception and anomaly detection
- A temporal world model of hosts, users, processes, files, and network connections
- Symbolic reasoning over attack relationships
- Probabilistic belief states for hidden attack stages
- Active inference to select the next investigation or defensive action

The system is intended as an intelligent layer on top of existing endpoint telemetry and detection, rather than as a complete replacement for traditional antivirus.

## 2. Core Research Question

Given the same endpoint telemetry, can a neuro-symbolic world model with active investigation:

1. Detect multi-stage attacks with fewer observations?
2. Reduce false positives using contextual reasoning?
3. Detect previously unseen attack behaviors more effectively?
4. Reduce expensive investigations by selectively gathering information?
5. Reconstruct and predict attack trajectories?

## 3. System Architecture

```text
                    RAW EVENTS
                         |
                         v
                +-----------------+
                | Event Collector |
                +--------+--------+
                         |
                         v
                +-----------------+
                | Feature Builder |
                +----+--------+---+
                     |        |
                     v        v
              +----------+ +----------------+
              | ML Model | | World Model    |
              | Baseline | | Graph + State  |
              +----+-----+ +-------+--------+
                   |               |
                   v               v
               Risk Score   Symbolic Reasoner
                                   |
                                   v
                            Belief State Engine
                                   |
                                   v
                            Active Inference
                                   |
                                   v
                    Investigate / Alert / Contain
```

## 4. V1 Scope

Focus on endpoint telemetry and these behavioral stages:

- Suspicious execution
- Process spawning
- Persistence indicators
- Credential-access indicators
- Lateral-movement indicators
- Command-and-control indicators

Do not initially attempt to support every malware type or every operating system.

## 5. Telemetry Schema

### Process Events

```text
process_id
parent_process_id
process_name
command_line
user
timestamp
```

### File Events

```text
file_hash
file_path
file_created
file_modified
parent_process
```

### Network Events

```text
source_process
destination_ip
destination_domain
port
connection_frequency
timestamp
```

### Authentication Events

```text
user
source
destination
login_success
timestamp
```

## 6. Baseline ML Models

The same telemetry must be used by both the baseline and proposed system.

Start with:

- XGBoost
- Random Forest
- Small neural network

The baseline produces:

P(Malicious | Features)

This provides a conventional ML detection system against which the proposed architecture can be evaluated.

## 7. World Model

Represent the environment as a temporal graph:

G_t = (V_t, E_t)

### Node Types

- Host
- User
- Process
- File
- IP
- Domain
- Attack Technique

### Relationships

- spawned
- created
- connected_to
- authenticated_to
- modified
- accessed

Example:

```text
User
  |
  v
WINWORD.EXE
  |
  | spawned
  v
powershell.exe
  |
  | connected_to
  v
External Domain
```

The graph persists over time and allows separate events to be connected into a possible attack trajectory.

## 8. Symbolic Reasoning Layer

Start with approximately 10-20 high-value behavioral rules.

Example:

```text
IF

Office Process
    ->
Script Interpreter

AND

Script Interpreter
    ->
Rare External Destination

THEN

Increase belief in Suspicious Execution
```

Another example:

```text
IF

Suspicious Process
+
Credential Access Indicator
+
Remote Connection

THEN

Increase belief in Potential Lateral Movement
```

The rules should describe relationships and behavior rather than depend only on malware signatures.

## 9. Probabilistic Belief State

The system estimates hidden attack states:

P(S_t | O_1:t)

Possible states:

- Normal
- Suspicious Execution
- Credential Access
- Lateral Movement
- Command and Control
- Compromised

Example:

```text
Normal                0.45
Suspicious Execution  0.75
Credential Access     0.40
Lateral Movement      0.15
Compromised           0.68
```

New evidence updates these beliefs.

The objective is to estimate the evolving attack state, rather than only classify individual events.

## 10. Active Inference Engine

For V1, use a practical action-selection approximation.

Possible actions:

- Do nothing
- Inspect parent process
- Inspect network history
- Inspect file reputation or provenance
- Inspect related hosts
- Increase monitoring
- Block a connection in the test environment
- Simulate endpoint isolation

Score actions using:

Score(a) = InformationGain(a) + RiskReduction(a) - ActionCost(a)

Select:

a* = argmax Score(a)

This allows the system to select the cheapest useful observation before escalating to more expensive investigation or containment.

## 11. Experimental Design

### Test 1: Standard Malware Classification

Goal: ensure the proposed layer does not significantly reduce basic detection quality.

Compare:

- XGBoost
- Neural network
- ML + neuro-symbolic reasoning

Metrics:

- Accuracy
- Precision
- Recall
- F1
- AUROC

### Test 2: Unseen Malware or Attack Family

Train using several families or behavioral groups and completely exclude one family/group from training.

Measure:

- Recall on unseen behavior
- False-positive rate
- F1

The hypothesis is that contextual reasoning may generalize beyond features associated with known samples.

### Test 3: Multi-Stage Attack Chain Detection

This is the main experiment.

Example sequence:

```text
Document
   ->
Script Interpreter
   ->
External Connection
   ->
Credential Access
   ->
Remote Connection
```

Compare how many events are required before detection.

Metrics:

Time to Detection:

TTD = t_detection - t_first_malicious_event

Events Required:

N_detect

The proposed system should ideally detect the connected sequence earlier than an event-by-event baseline.

### Test 4: Weak-Signal Attack

Create sequences where individual events are only mildly suspicious.

Example:

```text
Event 1: risk 0.32
Event 2: risk 0.41
Event 3: risk 0.38
Event 4: risk 0.44
```

Individually, none may trigger an alert.

Together:

E1 -> E2 -> E3 -> E4

may represent a dangerous trajectory.

Measure attack detection rate for the baseline and world model.

### Test 5: False Positive Reduction

Use legitimate but potentially suspicious workloads:

- Development and build tools
- Administrative scripting
- Backup operations
- Security scanning
- Remote management

Measure:

False Positive Rate
Precision
Recall

The world model should use identity, parent process, schedule, destination, and historical context to distinguish legitimate activity from attacks.

### Test 6: Active Investigation Efficiency

Compare:

System A:
Perform expensive investigation for every suspicious event.

System B:
Select the next observation based on expected information gain, risk reduction, and cost.

Measure:

- Number of deep investigations
- CPU time
- Memory usage
- Detection recall
- Detection latency

### Test 7: Attack Trajectory Prediction

After observing the first stages of a sequence, predict possible next attack stages.

Example:

```text
Execution
   ->
Suspicious Script
   ->
External Connection
```

Predict:

- Credential access
- Persistence
- Lateral movement

Measure Top-K prediction accuracy.

## 12. Evaluation Metrics

The final comparison should include:

| Metric | Purpose |
|---|---|
| Precision | Measure false alert quality |
| Recall | Measure attack detection |
| F1 Score | Balance precision and recall |
| AUROC | Classification discrimination |
| Detection Latency | How quickly attacks are detected |
| Events to Detection | Evidence required before detection |
| False Positive Rate | Benign activity incorrectly flagged |
| Unseen Attack Recall | Generalization to new behavior |
| Deep Investigation Count | Computational efficiency |
| CPU/RAM Overhead | Endpoint practicality |
| Attack Path Accuracy | Ability to reconstruct the sequence |
| Top-K Prediction Accuracy | Ability to predict next stages |

## 13. Eight-Week Implementation Plan

### Week 1: Data and ML Baseline

Build:

- Event schema
- Dataset loader
- XGBoost baseline
- Neural baseline
- Evaluation pipeline

Output:

Accuracy, Precision, Recall, F1, AUROC.

### Week 2: Event Graph

Implement entities:

- Host
- Process
- File
- User
- IP
- Domain

Implement relationships:

- spawned
- created
- connected_to
- authenticated_to
- modified
- accessed

### Week 3: World-State Engine

Implement a belief state such as:

```python
belief = {
    "normal": 0.70,
    "suspicious_execution": 0.20,
    "credential_access": 0.05,
    "lateral_movement": 0.02
}
```

Create evidence-update functions.

### Week 4: Symbolic Reasoning

Implement 10-20 behavioral rules connecting events into attack hypotheses.

### Week 5: Active Investigation

Implement safe, telemetry-oriented actions:

- inspect_process_tree
- inspect_network_history
- inspect_related_hosts
- increase_monitoring

For the prototype, containment actions should be simulated or restricted to an isolated test environment.

### Week 6: Attack-Chain Experiments

Run:

- Benign sequences
- Single-event suspicious activity
- Multi-stage sequences
- Weak-signal sequences
- Unseen behavior tests

Record timestamps and all observations.

### Week 7: Active Investigation Comparison

Compare:

System A:
ML -> Alert

System B:
ML -> World Model -> Symbolic Reasoning -> Active Investigation

Measure:

- Detection latency
- Events to detection
- False positives
- CPU
- RAM
- Investigation count
- Attack path accuracy

### Week 8: Results and Dashboard

Visualize:

```text
ATTACK TIMELINE

09:00 Normal login
09:04 Unusual process
09:05 External connection
09:06 Credential-access indicator

WORLD STATE

Normal                 12%
Suspicious Execution   88%
Credential Access      79%
Lateral Movement       61%

AGENT DECISION

Inspect related hosts

Reason:
High information gain
Low operational cost
```

## 14. Safe Testing Environment

Use isolated virtual machines and controlled, non-production behavioral simulations or established adversary-emulation datasets.

Recommended lab:

```text
+--------------------+
| Controller / Logs  |
| Python Backend     |
+---------+----------+
          |
     Isolated Lab
          |
     +----+----+
     |         |
     v         v
Windows VM   Linux VM
Telemetry    Telemetry
```

Do not test uncontrolled malware on personal machines, university networks, or production infrastructure.

## 15. Repository Architecture

```text
security-world-model/
|
|-- data/
|   |-- raw/
|   |-- processed/
|
|-- collector/
|   |-- event_normalizer.py
|
|-- baseline/
|   |-- xgboost_model.py
|   |-- neural_model.py
|
|-- world_model/
|   |-- graph.py
|   |-- entities.py
|   |-- state.py
|   |-- belief_update.py
|
|-- reasoning/
|   |-- rules.py
|   |-- attack_inference.py
|
|-- active_inference/
|   |-- actions.py
|   |-- action_scoring.py
|   |-- policy.py
|
|-- experiments/
|   |-- classification_test.py
|   |-- unseen_behavior_test.py
|   |-- attack_chain_test.py
|   |-- weak_signal_test.py
|   |-- false_positive_test.py
|   |-- investigation_efficiency_test.py
|
|-- evaluation/
|   |-- metrics.py
|   |-- plots.py
|
|-- dashboard/
|
|-- README.md
```

## 16. Expected Research Claim

The strongest claim should not be:

"We achieve the highest malware classification accuracy."

A more defensible hypothesis is:

"Using identical endpoint telemetry, a neuro-symbolic world model can integrate events across time and entities to identify multi-stage attack behavior with fewer observations, reduce context-dependent false positives, and selectively allocate investigation effort through active information gathering while maintaining competitive detection performance."

## 17. Final Success Criteria

The V1 will be considered successful if it demonstrates:

1. Detection recall equal to or better than the ML baseline.
2. Lower false-positive rates on context-dependent benign workloads.
3. Fewer events required to identify multi-stage attacks.
4. Comparable or lower detection latency.
5. Improved recall on held-out or unseen behavioral sequences.
6. Fewer expensive investigations for similar detection quality.
7. Ability to reconstruct a meaningful attack graph.
8. Measurable ability to predict likely next attack stages.

## 18. Recommended First Milestone

Build only this pipeline first:

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
                     10 Symbolic Rules
                           |
                           v
                       Belief State
                           |
                           v
                  Select Next Inspection
```

This is small enough to implement quickly while still demonstrating the core novelty: the transition from event-level classification to a security system that maintains a model of the environment, reasons about hidden attack states, and actively chooses what information to gather next.
