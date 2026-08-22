import { useEffect, useState } from "react";

const SLIDES = [
  "title",
  "problem",
  "compare",
  "see",
  "scoreboard",
  "cost",
  "business",
  "usecases",
  "stack",
  "gtm",
  "close",
];

export default function PitchScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        setIndex((n) => Math.min(SLIDES.length - 1, n + 1));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setIndex((n) => Math.max(0, n - 1));
      } else if (event.key === "Home") {
        setIndex(0);
      } else if (event.key === "End") {
        setIndex(SLIDES.length - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="deck">
      <div className="deck-stage">
        {SLIDES.map((id, i) => {
          const Slide = SLIDE_VIEWS[id];
          return (
            <div key={id} className={`slide-page ${i === index ? "current" : ""}`}>
              <Slide />
            </div>
          );
        })}
      </div>
      <footer className="deck-bar">
        <button type="button" disabled={index === 0} onClick={() => setIndex((n) => n - 1)}>
          ← Back
        </button>
        <ol>
          {SLIDES.map((slide, i) => (
            <li key={slide}>
              <button
                type="button"
                className={i === index ? "on" : ""}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            </li>
          ))}
        </ol>
        <span>
          {index + 1} / {SLIDES.length} · ← →
        </span>
        <button type="button" className="ghost" onClick={() => window.print()}>
          Print / PDF
        </button>
        <button
          type="button"
          className="primary"
          disabled={index === SLIDES.length - 1}
          onClick={() => setIndex((n) => n + 1)}
        >
          Next →
        </button>
      </footer>
    </div>
  );
}

function Title() {
  return (
    <section className="slide hero">
      <p className="kicker">NSUT hackathon · endpoint security pitch</p>
      <h1>See the attack, not just the file.</h1>
      <p className="lede">
        A neuro-symbolic world model that sits on the telemetry you already collect. Classic AV
        reads bytes. ML AV reads features. We read the story across process, file, network, and
        identity — then spend investigation budget only when it changes the belief.
      </p>
      <div className="hero-pills">
        <span>Layer, not rip-and-replace</span>
        <span>Same sensors · richer decisions</span>
        <span>64% fewer deep investigations</span>
      </div>
      <p className="fine">Simulator figures are from the V1 controlled run (seed 7). Not a field-malware claim.</p>
    </section>
  );
}

function Problem() {
  return (
    <section className="slide">
      <p className="kicker">The gap</p>
      <h2>Three expensive failures, one shared root.</h2>
      <div className="tri">
        <article>
          <em>Classic AV</em>
          <h3>Packed samples look clean</h3>
          <p>
            Scan-time signatures and simple run-time hooks never see the inner bytes of a crypter
            stub. In the lab, <code>PhotoViewer.crypt.exe</code> is CLEAN — then a Photos window
            opens like a normal app.
          </p>
        </article>
        <article>
          <em>ML-based AV</em>
          <h3>Context-blind alerts</h3>
          <p>
            Event-level models fire on PowerShell, backups, scanners, and admin scripts. On the
            simulator they hit a <strong>37% false-positive rate</strong> on those benign families
            — which is how SOCs drown.
          </p>
        </article>
        <article>
          <em>The business leak</em>
          <h3>Investigations are the real bill</h3>
          <p>
            Seats are cheap compared with analyst minutes. Always-investigate policies burned{" "}
            <strong>358 deep looks</strong> on 124 sequences. The world model spent{" "}
            <strong>128</strong> for the same detection quality.
          </p>
        </article>
      </div>
    </section>
  );
}

function Compare() {
  return (
    <section className="slide">
      <p className="kicker">Side by side</p>
      <h2>What each product actually buys you.</h2>
      <div className="table-wrap">
        <table className="cmp">
          <thead>
            <tr>
              <th />
              <th>Classic AV</th>
              <th>ML-based AV</th>
              <th className="ours">Neuro-symbolic layer</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.k}>
                <th>{row.k}</th>
                <td>{row.av}</td>
                <td>{row.ml}</td>
                <td className="ours">{row.ns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const ROWS = [
  {
    k: "Sees",
    av: "On-disk bytes, hashes, known families",
    ml: "Per-event features → P(malicious)",
    ns: "Temporal graph + attack-stage belief",
  },
  {
    k: "Packed / unknown",
    av: "Often CLEAN (bypass)",
    ml: "Unstable if the feature vector is new",
    ns: "Behavior after unpack is enough",
  },
  {
    k: "Admin / dev / backup",
    av: "Usually quiet",
    ml: "High contextual FPR (0.37 in sim)",
    ns: "Context rules drop belief (0.00 FPR)",
  },
  {
    k: "Explainability",
    av: "Signature name",
    ml: "Score + SHAP if you add it",
    ns: "Fired rules + world state + next action",
  },
  {
    k: "Action",
    av: "Quarantine / block",
    ml: "Alert the queue",
    ns: "Inspect only when IG + risk > cost",
  },
  {
    k: "Install story",
    av: "Agent you already own",
    ml: "New model, new false-positive curve",
    ns: "Overlay on the same telemetry stream",
  },
];

function See() {
  return (
    <section className="slide">
      <p className="kicker">How they think</p>
      <h2>Same event. Three memories.</h2>
      <div className="tri think">
        <article>
          <em>Classic AV</em>
          <pre>{`hash(file) ∈ threat_db?
strings(file) ∈ family_YARA?
hook(API) ∈ known_bad?`}</pre>
          <p>No memory of the last hour. A packed stub is a new hash.</p>
        </article>
        <article>
          <em>ML-based AV</em>
          <pre>{`x = features(event)
risk = XGBoost(x)
alert if risk ≥ θ`}</pre>
          <p>Strong on a single loud event. Weak on a quiet chain and on loud-but-legit admin.</p>
        </article>
        <article className="ours">
          <em>Neuro-symbolic</em>
          <pre>{`G_t ← graph(process, file, net, auth)
rules → stage evidence
P(S_t | O) ← update
a* = IG + Δrisk − cost`}</pre>
          <p>Office → script → rare host is one object, not three tickets.</p>
        </article>
      </div>
    </section>
  );
}

function Scoreboard() {
  return (
    <section className="slide">
      <p className="kicker">Controlled simulator · seed 7</p>
      <h2>Detection is not the only score. Context is.</h2>
      <div className="metrics">
        {METRICS.map((item) => (
          <article key={item.k}>
            <em>{item.k}</em>
            <div className="pair">
              <span>
                <small>ML AV</small>
                <strong>{item.ml}</strong>
              </span>
              <span className="win">
                <small>Neuro-symbolic</small>
                <strong>{item.ns}</strong>
              </span>
            </div>
          </article>
        ))}
      </div>
      <p className="fine">
        Identical synthetic telemetry. Classic AV is not in this table — it never sees packed
        inner bytes or multi-event trajectories. Numbers support the architecture, not a production
        ROC curve.
      </p>
    </section>
  );
}

const METRICS = [
  { k: "Classification F1", ml: "0.87", ns: "0.99" },
  { k: "False-positive rate", ml: "0.08", ns: "0.00" },
  { k: "Unseen-family F1", ml: "0.62", ns: "1.00" },
  { k: "Events to detection", ml: "1.75", ns: "1.00" },
  { k: "Contextual benign FPR", ml: "0.37", ns: "0.00" },
  { k: "Deep investigations", ml: "358", ns: "128 (−64%)" },
];

function Cost() {
  return (
    <section className="slide">
      <p className="kicker">Cost effectiveness</p>
      <h2>The expensive resource is attention, not another agent.</h2>
      <div className="cost-grid">
        <article className="big">
          <em>Illustrative SOC math on the same 124 sequences</em>
          <h3>
            358 → 128 looks
            <span> −64% investigation load</span>
          </h3>
          <p>
            At 15 analyst minutes each, that is about <strong>90 hours vs 32 hours</strong> of
            queue time. Active inference skips the look when the belief is already normal or
            already decided.
          </p>
        </article>
        <article>
          <em>Classic AV economics</em>
          <p>
            Lowest license line. Highest residual risk on packed, living-off-the-land, and
            first-seen hashes. Breach and dwell time dominate the TCO, not the seat price.
          </p>
        </article>
        <article>
          <em>ML AV economics</em>
          <p>
            Better recall on noisy features, but 37% contextual FPR turns every admin Tuesday into
            tickets. You pay for GPUs <em>and</em> for people dismissing them.
          </p>
        </article>
        <article>
          <em>Our overlay economics</em>
          <p>
            No new sensor tax. 21 rules + a small belief update are cheaper than retraining a
            weekly black box. Explainable actions cut “why did this fire?” time.
          </p>
        </article>
      </div>
    </section>
  );
}

function Business() {
  return (
    <section className="slide">
      <p className="kicker">Business</p>
      <h2>Sell the layer that makes the stack you already bought honest.</h2>
      <div className="tri">
        <article>
          <em>Offer</em>
          <h3>World-model overlay</h3>
          <p>
            Ingest process / file / network / auth from Defender, CrowdStrike, or Sysmon-class
            feeds. Return a belief, a fired-rule list, and a next action — not another unsigned
            score.
          </p>
        </article>
        <article>
          <em>Buyer</em>
          <h3>SOC lead · MSSP · CISO</h3>
          <p>
            They already paid for AV. They are buying fewer wasted investigations, an audit trail
            for packed “CLEAN” binaries, and a story they can tell a board: we watch behavior,
            not just signatures.
          </p>
        </article>
        <article>
          <em>Why we win the RFP question</em>
          <h3>Complement, do not compete</h3>
          <p>
            Classic AV stays on the disk. ML stays on the event. We own the trajectory and the
            investigation policy. That is a wedge, not a rip-and-replace war.
          </p>
        </article>
      </div>
      <ul className="bullets">
        <li>
          <strong>Margin for MSSPs:</strong> same customer seat, fewer Tier-1 minutes.
        </li>
        <li>
          <strong>Compliance:</strong> symbolic rules map to “why” for auditors; beliefs are
          inspectable.
        </li>
        <li>
          <strong>Moat:</strong> graph + stage physics + costed actions, not a one-off classifier.
        </li>
      </ul>
    </section>
  );
}

function UseCases() {
  return (
    <section className="slide">
      <p className="kicker">Use cases</p>
      <h2>Where the three-layer stack earns its keep.</h2>
      <div className="uses">
        {USES.map((item) => (
          <article key={item.t}>
            <em>{item.who}</em>
            <h3>{item.t}</h3>
            <p>{item.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const USES = [
  {
    who: "Knowledge worker PC",
    t: "Packed “Photos” dropper",
    d: "AV says CLEAN. Photos opens. World model still blocks host persist after temp execution and rare outbound.",
  },
  {
    who: "Engineering / IT",
    t: "Admin and build noise",
    d: "weekly_health.ps1 and compiler toolchains stay Normal. ML AV would have opened tickets.",
  },
  {
    who: "Finance / legal share",
    t: "Multi-stage theft",
    d: "Document → script → vault copy is one campaign object. Contain before the second hop.",
  },
  {
    who: "Campus / lab",
    t: "Shared workstations",
    d: "Firmware-style sandbox gate before host execute. Snapshot and discard; no production malware.",
  },
  {
    who: "MSSP",
    t: "Triage as a product",
    d: "Active inference picks inspect_process_tree vs do_nothing. Analysts see the reason, not a raw score.",
  },
  {
    who: "Regulated org",
    t: "Explainable deny",
    d: "Rule list + belief vector is the paper trail. “Unknown hash + office-spawned-script + rare host.”",
  },
];

function Stack() {
  return (
    <section className="slide">
      <p className="kicker">Holistic solution</p>
      <h2>One pipeline. Three verdicts. One host decision.</h2>
      <ol className="stack">
        <li>
          <strong>Classic AV</strong>
          <span>Scan-time + run-time. Cheap first filter. Can be bypassed.</span>
        </li>
        <li>
          <strong>Firmware / sandbox gate</strong>
          <span>Measure hash, signature, allow-list. Host execute stays denied.</span>
        </li>
        <li>
          <strong>ML risk</strong>
          <span>XGBoost / RF / MLP on the same event vector. Fast prior.</span>
        </li>
        <li>
          <strong>World model</strong>
          <span>Graph of hosts, users, processes, files, IPs. 21 behavioral rules.</span>
        </li>
        <li>
          <strong>Active inference</strong>
          <span>Score(a) = information gain + risk reduction − cost.</span>
        </li>
        <li className="end">
          <strong>Allow · inspect · isolate</strong>
          <span>Paint opens on the host. PhotoViewer.crypt never gets a real mapping.</span>
        </li>
      </ol>
    </section>
  );
}

function Gtm() {
  return (
    <section className="slide">
      <p className="kicker">Go to market</p>
      <h2>Start where packed samples and SOC queues already hurt.</h2>
      <div className="tri">
        <article>
          <em>Phase 1</em>
          <h3>Lab + design-partner SOC</h3>
          <p>
            Ship the workstation and campaign lab as the proof. Overlay on one existing EDR
            export. Measure investigation count and contextual FPR, not vanity accuracy.
          </p>
        </article>
        <article>
          <em>Phase 2</em>
          <h3>MSSP pack</h3>
          <p>
            Per-tenant belief store, shared rule pack, billed on endpoints + investigation
            minutes saved. Classic AV remains the customer’s SKU.
          </p>
        </article>
        <article>
          <em>Phase 3</em>
          <h3>Vertical playbooks</h3>
          <p>
            Finance theft paths, hospital imaging workstations, campus labs. Same engine, different
            allow-lists and stage priors.
          </p>
        </article>
      </div>
      <div className="note">
        Safety stance we keep in every pitch: simulated telemetry only. No live malware, no
        production implant, no real BIOS control. The firmware gate in the demo is a policy UI.
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="slide hero close">
      <p className="kicker">Ask</p>
      <h1>Keep the AV you have. Add a world model that spends less and explains more.</h1>
      <div className="close-grid">
        <article>
          <em>Classic AV</em>
          <p>Necessary. Not sufficient. Packed CLEAN is the demo.</p>
        </article>
        <article>
          <em>ML-based AV</em>
          <p>Useful prior. Expensive when it cannot see context.</p>
        </article>
        <article className="ours">
          <em>Neuro-symbolic</em>
          <p>Trajectory, belief, and a costed next action — on the same stream.</p>
        </article>
      </div>
      <p className="lede short">
        Next: open the sandbox workstation and run PhotoViewer.crypt.exe, then the campaign lab
        to watch both detectors race.
      </p>
    </section>
  );
}

const SLIDE_VIEWS = {
  title: Title,
  problem: Problem,
  compare: Compare,
  see: See,
  scoreboard: Scoreboard,
  cost: Cost,
  business: Business,
  usecases: UseCases,
  stack: Stack,
  gtm: Gtm,
  close: Close,
};
