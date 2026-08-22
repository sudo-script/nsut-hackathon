import { useEffect, useState } from "react";
import { Donut, GroupedBars, HorzBars, PALETTE, Radar } from "../components/PitchCharts.jsx";

const SLIDES = [
  "title",
  "problem",
  "compare",
  "radar",
  "see",
  "scoreboard",
  "cost",
  "demo",
  "business",
  "usecases",
  "stack",
  "gtm",
  "close",
];

const THREE = [
  { name: "Classic AV", color: PALETTE.av },
  { name: "ML-based AV", color: PALETTE.ml },
  { name: "Neuro-symbolic", color: PALETTE.ns },
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
                aria-label={`Slide ${i + 1}: ${slide}`}
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
        A neuro-symbolic world model on the telemetry you already collect. Classic AV reads bytes.
        ML AV reads features. We read the story — then spend investigation budget only when it
        changes the belief.
      </p>
      <div className="hero-pills">
        <span>Layer, not rip-and-replace</span>
        <span>Same sensors · richer decisions</span>
        <span>64% fewer deep investigations</span>
      </div>
      <p className="fine">Simulator figures: V1 controlled run, seed 7. Market mix is an illustrative GTM split.</p>
    </section>
  );
}

function Problem() {
  return (
    <section className="slide">
      <p className="kicker">The gap</p>
      <h2>Three expensive failures, one shared root.</h2>
      <div className="split">
        <div className="tri tight">
          <article>
            <em>Classic AV</em>
            <h3>Packed samples look clean</h3>
            <p>
              <code>PhotoViewer.crypt.exe</code> is CLEAN. Photos opens like a normal app. The
              stub never matched a signature.
            </p>
          </article>
          <article>
            <em>ML-based AV</em>
            <h3>Context-blind alerts</h3>
            <p>
              PowerShell, backups, scanners. Simulator contextual FPR <strong>37%</strong> — that
              is how a SOC queue dies.
            </p>
          </article>
          <article>
            <em>The bill</em>
            <h3>Investigations, not seats</h3>
            <p>
              Always-investigate: <strong>358</strong> looks. World model: <strong>128</strong> on
              the same 124 sequences.
            </p>
          </article>
        </div>
        <HorzBars
          title="Where the money actually goes (illustrative index)"
          rows={[
            { label: "AV license", value: 18, color: PALETTE.av, note: "cheap line" },
            { label: "ML / GPU + seats", value: 34, color: PALETTE.ml, note: "model tax" },
            { label: "Analyst minutes", value: 78, color: PALETTE.hot, note: "real TCO" },
            { label: "Residual breach", value: 96, color: "#c45c5c", note: "packed miss" },
          ]}
        />
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

function RadarSlide() {
  return (
    <section className="slide">
      <p className="kicker">Capability comparison</p>
      <h2>AV owns known bytes. ML owns a score. We own the trajectory.</h2>
      <div className="split charts">
        <Radar
          title="Capability map (0–10 qualitative)"
          axes={["Known malware", "Packed / first-seen", "Admin context", "Multi-stage", "Explain", "Invest. efficiency"]}
          series={[
            { name: "Classic AV", color: PALETTE.av, values: [9, 2, 7, 2, 5, 6] },
            { name: "ML-based AV", color: PALETTE.ml, values: [8, 5, 2, 4, 3, 3] },
            { name: "Neuro-symbolic", color: PALETTE.ns, values: [8, 8, 9, 9, 9, 9] },
          ]}
        />
        <GroupedBars
          title="Qualitative score by job (higher is better)"
          groups={["Packed", "Context", "Chains", "Explain"]}
          max={10}
          series={[
            { ...THREE[0], values: [2, 7, 2, 5] },
            { ...THREE[1], values: [5, 2, 4, 3] },
            { ...THREE[2], values: [8, 9, 9, 9] },
          ]}
        />
      </div>
      <p className="fine">Radar is a product judgment, not a benchmark. Simulator metrics are on the next slide.</p>
    </section>
  );
}

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
      <div className="charts-3">
        <GroupedBars
          title="Quality (higher better)"
          groups={["F1", "Unseen F1", "Weak-signal F1"]}
          max={1}
          series={[
            { name: "XGBoost", color: PALETTE.ml, values: [0.87, 0.62, 0.62] },
            { name: "Neuro-symbolic", color: PALETTE.ns, values: [0.99, 1.0, 1.0] },
          ]}
        />
        <GroupedBars
          title="Waste (lower better)"
          groups={["FPR", "Contextual FPR"]}
          max={0.4}
          unit="%"
          series={[
            { name: "XGBoost", color: PALETTE.ml, values: [0.08, 0.37] },
            { name: "Neuro-symbolic", color: PALETTE.ns, values: [0.0, 0.0] },
          ]}
        />
        <GroupedBars
          title="Effort on 124 sequences"
          groups={["Deep looks", "Alerts"]}
          max={380}
          series={[
            { name: "Always-investigate ML", color: PALETTE.ml, values: [358, 84] },
            { name: "Active inference NS", color: PALETTE.ns, values: [128, 64] },
          ]}
        />
      </div>
      <p className="fine">
        Identical synthetic telemetry. Classic AV is absent here — it never sees packed inner bytes
        or multi-event trajectories. Architecture evidence, not a production ROC.
      </p>
    </section>
  );
}

function Cost() {
  return (
    <section className="slide">
      <p className="kicker">Cost effectiveness</p>
      <h2>The expensive resource is attention, not another agent.</h2>
      <div className="split charts">
        <GroupedBars
          title="Illustrative queue time · 15 min / look"
          groups={["Looks", "Analyst hours"]}
          max={360}
          series={[
            { name: "ML always-investigate", color: PALETTE.ml, values: [358, 90] },
            { name: "Neuro-symbolic policy", color: PALETTE.ns, values: [128, 32] },
          ]}
        />
        <HorzBars
          title="Relative TCO index (illustrative, 100 = worst line)"
          rows={[
            { label: "Classic AV", value: 72, color: PALETTE.av, note: "cheap seat, packed residual" },
            { label: "ML-based AV", value: 88, color: PALETTE.ml, note: "GPU + 37% context FPR" },
            { label: "NS overlay + existing AV", value: 38, color: PALETTE.ns, note: "same sensors, −64% looks" },
          ]}
        />
      </div>
      <div className="tri tight">
        <article>
          <em>Classic</em>
          <p>Lowest license. Highest residual on first-seen and living-off-the-land.</p>
        </article>
        <article>
          <em>ML AV</em>
          <p>You pay for inference and for people dismissing admin Tuesdays.</p>
        </article>
        <article className="ours">
          <em>Overlay</em>
          <p>21 rules + a belief update. Inspect only when information gain beats cost.</p>
        </article>
      </div>
    </section>
  );
}

function Demographics() {
  return (
    <section className="slide">
      <p className="kicker">Demographics · who we sell to, who we watch</p>
      <h2>A 200-seat SOC is not a 12-tenant MSSP. The engine stays the same.</h2>
      <div className="demo-grid">
        <div className="personas">
          {PERSONAS.map((person) => (
            <article key={person.name}>
              <div className="avatar" style={{ background: person.color }}>
                {person.initials}
              </div>
              <div>
                <strong>{person.name}</strong>
                <em>
                  {person.role} · {person.age} · {person.place}
                </em>
                <p>{person.pain}</p>
              </div>
            </article>
          ))}
        </div>
        <Donut
          title="Illustrative GTM mix"
          slices={[
            { label: "Finance / fintech", value: 28, color: "#3ee0a0" },
            { label: "MSSP", value: 22, color: "#5ce1e6" },
            { label: "Healthcare", value: 18, color: "#e9b14a" },
            { label: "Campus / edu", value: 16, color: "#c77dff" },
            { label: "Manufacturing", value: 16, color: "#8aa0b5" },
          ]}
        />
        <HorzBars
          title="Endpoint population we model first"
          rows={[
            { label: "Knowledge workers", value: 42, color: "#5ce1e6", note: "42%" },
            { label: "Engineers / IT admin", value: 24, color: PALETTE.ml, note: "24%" },
            { label: "Shared lab / campus", value: 18, color: "#c77dff", note: "18%" },
            { label: "Regulated clinical / finance", value: 16, color: PALETTE.ns, note: "16%" },
          ]}
        />
        <HorzBars
          title="SOC role mix — we buy back Tier-1 minutes"
          rows={[
            { label: "Tier-1 triage", value: 55, color: PALETTE.hot, note: "55%" },
            { label: "Tier-2 hunt", value: 30, color: PALETTE.ml, note: "30%" },
            { label: "Tier-3 / IR", value: 15, color: PALETTE.ns, note: "15%" },
          ]}
        />
      </div>
      <p className="fine">
        Mix and personas are a design-partner hypothesis for India-first + GCC MSSP, not a census.
        Org sizes we pitch: 50–250, 250–2k, and multi-tenant MSSP.
      </p>
    </section>
  );
}

const PERSONAS = [
  {
    name: "Ananya Rao",
    initials: "AR",
    role: "SOC lead",
    age: 34,
    place: "Bengaluru fintech, ~220 seats",
    pain: "Queue is admin PowerShell. Board asks why a packed “Photos” was CLEAN.",
    color: "#1f6b4d",
  },
  {
    name: "Rahul Mehta",
    initials: "RM",
    role: "MSSP ops",
    age: 41,
    place: "12 tenants, shared Tier-1",
    pain: "Margin is analyst minutes. Another model that pages every backup job is a non-starter.",
    color: "#5c4920",
  },
  {
    name: "Meera Iyer",
    initials: "MI",
    role: "Campus IT",
    age: 29,
    place: "Shared lab PCs, NSUT-like",
    pain: "Students run unknown binaries. Need sandbox-first, not a new agent war.",
    color: "#3d2a5c",
  },
  {
    name: "Vikram Shah",
    initials: "VS",
    role: "CISO",
    age: 47,
    place: "Healthcare group",
    pain: "Auditors want “why denied.” A 0.91 score is not a paper trail.",
    color: "#5a1820",
  },
];

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
            They already paid for AV. They buy fewer wasted investigations, an audit trail for
            packed CLEAN binaries, and a board story: we watch behavior, not just signatures.
          </p>
        </article>
        <article>
          <em>RFP wedge</em>
          <h3>Complement, do not compete</h3>
          <p>
            Classic AV stays on disk. ML stays on the event. We own the trajectory and the
            investigation policy.
          </p>
        </article>
      </div>
      <ul className="bullets">
        <li>
          <strong>MSSP margin:</strong> same customer seat, fewer Tier-1 minutes.
        </li>
        <li>
          <strong>Compliance:</strong> symbolic rules are the “why” for auditors.
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
          <strong>Firmware / sandbox + file-seal ledger</strong>
          <span>Authorities hash-sign golden files on a lab chain. Dummy ransom writes are denied.</span>
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
      <div className="split charts">
        <HorzBars
          title="Beachhead by org size (illustrative)"
          rows={[
            { label: "50–250 seats", value: 35, color: PALETTE.ns, note: "campus + SME SOC" },
            { label: "250–2,000", value: 40, color: "#5ce1e6", note: "fintech / hospital IT" },
            { label: "MSSP multi-tenant", value: 25, color: PALETTE.ml, note: "shared Tier-1" },
          ]}
        />
        <div className="tri tight">
          <article>
            <em>Phase 1</em>
            <h3>Lab + design partner</h3>
            <p>Overlay on one EDR export. Measure looks and contextual FPR, not vanity accuracy.</p>
          </article>
          <article>
            <em>Phase 2</em>
            <h3>MSSP pack</h3>
            <p>Per-tenant belief store. Bill endpoints + minutes saved. Their AV SKU stays.</p>
          </article>
          <article>
            <em>Phase 3</em>
            <h3>Vertical priors</h3>
            <p>Finance theft, imaging PCs, campus labs. Same engine, different allow-lists.</p>
          </article>
        </div>
      </div>
      <div className="note">
        Safety stance: simulated telemetry only. No live malware, no production implant, no real
        BIOS control. The firmware gate in the demo is a policy UI.
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
        Next: sandbox workstation → PhotoViewer.crypt.exe, then the campaign lab to watch both
        detectors race.
      </p>
    </section>
  );
}

const SLIDE_VIEWS = {
  title: Title,
  problem: Problem,
  compare: Compare,
  radar: RadarSlide,
  see: See,
  scoreboard: Scoreboard,
  cost: Cost,
  demo: Demographics,
  business: Business,
  usecases: UseCases,
  stack: Stack,
  gtm: Gtm,
  close: Close,
};
