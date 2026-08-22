import { useEffect, useState } from "react";
import { Donut, HorzBars, PALETTE, ScatterPlot } from "../components/PitchCharts.jsx";
import { FUNDS, MARKET, UNIT } from "../data/finance";

const SLIDES = [
  "title",
  "pain",
  "existing",
  "ours",
  "coord",
  "trl",
  "samsom",
  "gtm",
  "raise",
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
      <p className="kicker">The short version</p>
      <h1>Your antivirus reads a file. Hackers send a story.</h1>
      <p className="lede">
        A packed “Photos” app can look clean. A backup script can look evil. People then sit in a dark room
        clicking tickets until they hate their job. We built a world model that reads the story — and we
        already have the Active Inference brain that decides what to look at next.
      </p>
      <div className="hero-pills">
        <span>Keep the AV you paid for</span>
        <span>Catch the sneaky file</span>
        <span>Stop drowning the SOC</span>
      </div>
    </section>
  );
}

function Pain() {
  return (
    <section className="slide">
      <p className="kicker">The pain · why this is a pain in the ass</p>
      <h2>Security today is two bad movies at once.</h2>
      <div className="tri">
        <article>
          <em>Movie 1</em>
          <h3>The wolf in a hoodie named Photos</h3>
          <p>
            Bad software hides in a zip. Classic AV says CLEAN. It opens like a normal app. Then it
            locks payroll. You find out on Monday.
          </p>
        </article>
        <article>
          <em>Movie 2</em>
          <h3>The intern who ran a script</h3>
          <p>
            IT runs a health check. ML AV screams. Twelve tickets. Three hours. Nothing was wrong.
            Tomorrow it happens again.
          </p>
        </article>
        <article>
          <em>The hangover</em>
          <h3>Humans are the product</h3>
          <p>
            A real look at an alert is 20–40 minutes and twenty to forty bucks. A 24×7 SOC is a
            million-dollar people machine. The software is cheap. The boredom is not.
          </p>
        </article>
      </div>
      <p className="lede short">Nobody wants another dashboard. They want fewer stupid Monday mornings.</p>
    </section>
  );
}

function Existing() {
  return (
    <section className="slide">
      <p className="kicker">What people already bought</p>
      <h2>Existing kits. Each one is good at one thing and annoying at the rest.</h2>
      <div className="tri">
        <article>
          <em>Classic AV</em>
          <h3>The bouncer with a guest list</h3>
          <p>
            Knows last year’s faces. A new costume walks in. Packed file? CLEAN. Cheap. Quiet. Also
            kind of blind.
          </p>
        </article>
        <article>
          <em>ML / EDR</em>
          <h3>The smoke alarm that hates toast</h3>
          <p>
            Great when the house is actually on fire. Also screams at the oven. Your best people
            spend the day saying “not a fire.”
          </p>
        </article>
        <article>
          <em>More analysts</em>
          <h3>Throw humans at the queue</h3>
          <p>
            Works. Costs a fortune. Burns people out. Does not scale to every campus PC and every
            MSSP tenant.
          </p>
        </article>
      </div>
    </section>
  );
}

function Ours() {
  return (
    <section className="slide">
      <p className="kicker">What we built</p>
      <h2>We don’t replace the bouncer. We remember the night.</h2>
      <div className="tri">
        <article className="ours">
          <em>1 · World model</em>
          <h3>A map, not a score</h3>
          <p>
            Process, file, network, login — one picture. “Word opened a script that called a weird
            host” is one story, not three tickets.
          </p>
        </article>
        <article className="ours">
          <em>2 · Active Inference</em>
          <h3>Already built. Plugs in here.</h3>
          <p>
            The model picks the next cheap look: process tree, network, or do nothing. Score = “what
            do I learn?” + “how much safer?” − “how annoying is this?”
          </p>
        </article>
        <article className="ours">
          <em>3 · BIOS + hash network</em>
          <h3>Files get a wax seal</h3>
          <p>
            Real authorities sign golden hashes onto a lab chain. Dummy ransom can paint a lock on
            the left PC. The right PC says no. Hashes don’t move.
          </p>
        </article>
      </div>
      <p className="lede short">Plain deal: keep Defender / CrowdStrike. We sit on the same stream and stop the dumb spend.</p>
    </section>
  );
}

function Coord() {
  return (
    <section className="slide">
      <p className="kicker">Same picture, all the methods</p>
      <h2>Up = catches sneaky stuff. Right = SOC stays sane.</h2>
      <div className="split charts">
        <ScatterPlot
          title="Where each method actually lives"
          xLabel="SOC stays sane  →"
          yLabel="Catches the sneaky file  →"
          points={[
            { name: "Classic AV", x: 7.2, y: 2.2, color: PALETTE.av },
            { name: "Signatures", x: 6.4, y: 3.0, color: "#8eae9a" },
            { name: "ML AV", x: 2.4, y: 6.2, color: PALETTE.ml },
            { name: "EDR console", x: 3.6, y: 6.8, color: "#e9b14a" },
            { name: "Throw people", x: 5.5, y: 7.4, color: "#c77dff" },
            { name: "Us", x: 8.6, y: 8.5, color: PALETTE.ns, ours: true },
          ]}
        />
        <div className="tri tight">
          <article>
            <em>Bottom-right</em>
            <p>AV. Chill. Misses the costume party.</p>
          </article>
          <article>
            <em>Top-left</em>
            <p>ML / EDR. Sees smoke. Also hates toast.</p>
          </article>
          <article className="ours">
            <em>Top-right</em>
            <p>Us. Story + a cheap next look. That is the product.</p>
          </article>
        </div>
      </div>
      <p className="fine">Judgment map, not a lab ROC. Simulator scoreboard is in the campaign tab if you want the nerd version.</p>
    </section>
  );
}

function Trl() {
  return (
    <section className="slide">
      <p className="kicker">TRL · what is real today</p>
      <h2>Active Inference is not a slide. It already runs.</h2>
      <div className="trl">
        {TRL.map((row) => (
          <article key={row.k}>
            <div className="trl-top">
              <strong>{row.k}</strong>
              <span>TRL {row.n}</span>
            </div>
            <b>
              <i style={{ width: `${row.n * 11}%` }} />
            </b>
            <p>{row.d}</p>
          </article>
        ))}
      </div>
      <p className="lede short">
        NASA-style TRL: 1 idea → 9 in the field. We are a working lab (4–5), not a PowerPoint (1) and
        not a Fortune-500 rollout (9). The Active Inference policy from the Python model drops into
        this workstation the same way: same events, next action, costed.
      </p>
    </section>
  );
}

const TRL = [
  {
    k: "Active Inference engine",
    n: 5,
    d: "Built. Score(a) = information gain + risk drop − cost. Tests on dummy campaigns already pick inspect vs do-nothing.",
  },
  {
    k: "World model + 21 rules",
    n: 5,
    d: "Built. Graph of hosts, users, files, IPs. Lab FPR on admin noise went to zero. Still a simulator.",
  },
  {
    k: "Workstation + BIOS ledger demo",
    n: 4,
    d: "Built in this app. Packed Photos, dummy ransom, hash network. UI, not real firmware.",
  },
  {
    k: "Hook into real EDR",
    n: 3,
    d: "Not shipped. Next job: eat Defender / Sysmon JSON. That is the implementation step — the brain is ready.",
  },
];

function Samsom() {
  return (
    <section className="slide">
      <p className="kicker">Who pays · TAM / SAM / SOM</p>
      <h2>Big ocean. We only fish the investigation slice.</h2>
      <div className="split charts">
        <HorzBars
          title="Dollars, 2026 research"
          rows={[
            { label: "TAM  EDR+MDR", value: MARKET.edr2026 + MARKET.mdr2026, color: "#8aa0b5", note: "$8.0B already spent on agents + queues" },
            { label: "SAM  overlay", value: 1.2, color: "#5ce1e6", note: "$1.2B — the “why did this fire?” layer" },
            { label: "India cyber", value: MARKET.indiaCyber2026, color: "#c77dff", note: "$6.6B home field" },
            { label: "SOM  our Y3", value: 0.35, color: PALETTE.ns, note: "$5.9M ARR — a slice, on purpose" },
          ]}
        />
        <div className="tri tight">
          <article>
            <em>TAM</em>
            <h3>Everyone already bought a lock</h3>
            <p>$6.33B EDR + $1.62B MDR. We do not ask them to rip it out.</p>
          </article>
          <article>
            <em>SAM</em>
            <h3>The annoying 15%</h3>
            <p>Context, triage, “is this the intern?” That is the budget we take.</p>
          </article>
          <article className="ours">
            <em>SOM · year 3</em>
            <h3>$5.9M ARR</h3>
            <p>159k seats. 102 customers. India + GCC MSSP first. Not “we own EDR.”</p>
          </article>
        </div>
      </div>
      <p className="fine">Mordor / Windsor Drake / Gartner 2026. SOM bar is scaled so you can see it — it is small, and that is honest.</p>
    </section>
  );
}

function Gtm() {
  return (
    <section className="slide">
      <p className="kicker">Go to market · no mystery</p>
      <h2>Show the two movies. Then sell the overlay.</h2>
      <div className="tri">
        <article>
          <em>Door 1</em>
          <h3>One angry SOC lead</h3>
          <p>
            Fintech / campus / hospital IT. They already have AV. We plug the lab into their export.
            Price: about $3 per PC per month. A 500-PC shop is an $18k year — coffee money vs a
            burnt-out Tier-1.
          </p>
        </article>
        <article>
          <em>Door 2</em>
          <h3>One MSSP with twelve tenants</h3>
          <p>
            They sell minutes. We wholesale at $1.50/PC. Same brain, many logos. India managed
            security is the fast lane (+15% in 2026, Gartner).
          </p>
        </article>
        <article className="ours">
          <em>The move</em>
          <h3>Demo is the sales team</h3>
          <p>
            PhotoViewer.crypt opens. Dummy ransom hits the chain. Active Inference skips the dumb
            look. If that does not close a design partner, more slides will not either.
          </p>
        </article>
      </div>
    </section>
  );
}

function Raise() {
  return (
    <section className="slide">
      <p className="kicker">The ask</p>
      <h2>${UNIT.seedAsk}M seed. 18 months. Hook the brain to a real feed.</h2>
      <div className="split charts">
        <Donut title="Where the money goes" slices={FUNDS} />
        <div className="tri tight">
          <article className="ours">
            <em>Build</em>
            <p>45% — wire Active Inference + the ledger into live EDR JSON. That is TRL 3 → 6.</p>
          </article>
          <article>
            <em>Sell</em>
            <p>30% — three design-partner SOCs and one GCC MSSP. Not a 40-person field army.</p>
          </article>
          <article>
            <em>Stay alive</em>
            <p>25% — cloud, SOC2 start, reserve. First EBITDA aimed at year 3, $5.9M ARR.</p>
          </article>
        </div>
      </div>
      <p className="fine">
        Overlay $3 / MSSP $1.50 / ledger $0.75 per PC per month. CAC we model at $28k (category
        median is $35–55k). LTV/CAC about 5×. Full P&amp;L lives in finance.js if a spreadsheet person
        shows up.
      </p>
    </section>
  );
}

function Close() {
  return (
    <section className="slide hero close">
      <p className="kicker">That’s the business</p>
      <h1>Keep the lock. Add a memory. Spend attention like it costs money — because it does.</h1>
      <div className="close-grid">
        <article>
          <em>Problem</em>
          <p>Sneaky files look clean. Normal work looks sneaky. People pay for both mistakes.</p>
        </article>
        <article>
          <em>Old kits</em>
          <p>Guest lists, smoke alarms, more humans. Pick your pain.</p>
        </article>
        <article className="ours">
          <em>Us</em>
          <p>World model + Active Inference (already built) + sealed hashes. Layer. Not a rip.</p>
        </article>
      </div>
      <p className="lede short">Next: run PhotoViewer.crypt, then the BIOS ledger. The deck is the map. Those tabs are the product.</p>
    </section>
  );
}

const SLIDE_VIEWS = {
  title: Title,
  pain: Pain,
  existing: Existing,
  ours: Ours,
  coord: Coord,
  trl: Trl,
  samsom: Samsom,
  gtm: Gtm,
  raise: Raise,
  close: Close,
};
