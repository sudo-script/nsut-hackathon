import { useEffect, useState } from "react";
import { CostValuePlot, HorzBars, PALETTE, ScatterPlot } from "../components/PitchCharts.jsx";
import { COST_VALUE, MARKET } from "../data/finance";

const SLIDES = [
  "title",
  "pain",
  "existing",
  "ours",
  "coord",
  "customers",
  "trl",
  "samsom",
  "biz",
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
        A packed “Photos” app can look clean. A backup script can look evil. People then sit clicking
        tickets until they hate their job. We built a world model that reads the story — and we
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
            { name: "Signatures", x: 6.4, y: 3.0, color: "#5a8f78" },
            { name: "ML AV", x: 2.4, y: 6.2, color: "#e09a1a" },
            { name: "EDR console", x: 3.6, y: 6.8, color: "#e09a1a" },
            { name: "Throw people", x: 5.5, y: 7.4, color: "#8b5cf6" },
            { name: "Us", x: 8.6, y: 8.5, color: "#0c9a62", ours: true },
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

function Customers() {
  return (
    <section className="slide">
      <p className="kicker">Who actually buys this</p>
      <h2>Four humans. Four different ways Monday ruins them.</h2>
      <div className="who">
        {CUSTOMERS.map((person) => (
          <article key={person.name}>
            <div className="who-head">
              <b style={{ background: person.color }}>{person.initials}</b>
              <div>
                <strong>{person.name}</strong>
                <em>
                  {person.role} · {person.shop}
                </em>
              </div>
            </div>
            <p>
              <span>Without us</span> {person.pain}
            </p>
            <p>
              <span className="ok">With us</span> {person.win}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

const CUSTOMERS = [
  {
    name: "Ananya",
    initials: "AR",
    role: "SOC lead",
    shop: "Bengaluru fintech, ~220 PCs",
    color: "#0c9a62",
    pain: "Queue is admin PowerShell. Board asks why a packed Photos was CLEAN. She spends Friday explaining toast.",
    win: "One story per chain. Photos still opens in the lab; host persist does not. She keeps her weekend.",
  },
  {
    name: "Rahul",
    initials: "RM",
    role: "MSSP ops",
    shop: "12 tenants, shared Tier-1",
    color: "#e09a1a",
    pain: "His margin is analyst minutes. Another model that pages every backup job eats the contract.",
    win: "Wholesale $1.50/PC. Same brain, many logos. Backup jobs stay Normal. He sells minutes, not panic.",
  },
  {
    name: "Meera",
    initials: "MI",
    role: "Campus IT",
    shop: "Shared lab PCs",
    color: "#8b5cf6",
    pain: "Students run mystery binaries. She cannot install a new agent war on every machine. One ransom week ruins the lab.",
    win: "Sandbox-first + sealed hashes. Dummy ransom can look scary on the left. The right PC keeps the files.",
  },
  {
    name: "Vikram",
    initials: "VS",
    role: "CISO",
    shop: "Healthcare group",
    color: "#e85d4c",
    pain: "Auditors want “why denied.” A 0.91 score is not a paper trail. Packed CLEAN is a board slide he dreads.",
    win: "Fired rules + belief + a wax-sealed hash. He can say the sentence out loud in a meeting.",
  },
];

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
      <p className="kicker">Market · TAM / SAM / SOM</p>
      <h2>Big ocean. We only fish the investigation slice.</h2>
      <div className="split charts">
        <HorzBars
          title="Dollars, 2026 research"
          rows={[
            { label: "TAM  EDR+MDR", value: MARKET.edr2026 + MARKET.mdr2026, color: "#8aa0b5", note: "$8.0B already spent on agents + queues" },
            { label: "SAM  overlay", value: 1.2, color: "#2eb8c0", note: "$1.2B — the “why did this fire?” layer" },
            { label: "India cyber", value: MARKET.indiaCyber2026, color: "#8b5cf6", note: "$6.6B home field" },
            { label: "SOM  our Y3", value: 0.35, color: "#0c9a62", note: "$5.9M ARR — a slice, on purpose" },
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
            <p>159k seats. Those four customer types, India + GCC MSSP first. Not “we own EDR.”</p>
          </article>
        </div>
      </div>
      <p className="fine">Mordor / Windsor Drake / Gartner 2026. SOM bar is scaled so you can see it — it is small, and that is honest.</p>
    </section>
  );
}

function Biz() {
  return (
    <section className="slide">
      <p className="kicker">Business model · vs native AV</p>
      <h2>They pay more and still miss the costume. We are cheaper — and actually better.</h2>
      <div className="split charts cost-split">
        <CostValuePlot title="Cost vs how good it is · typical list 2025–26" points={COST_VALUE} />
        <div className="tri tight">
          <article className="ours">
            <em>Overlay Core</em>
            <h3>$3 / PC / month</h3>
            <p>Ananya’s 220 PCs ≈ $8k a year. 500 PCs ≈ $18k — the incremental line, not a rip.</p>
          </article>
          <article>
            <em>MSSP wholesale</em>
            <h3>$1.50 / PC / month</h3>
            <p>Rahul resells minutes. Native AV stays his customer’s SKU.</p>
          </article>
          <article>
            <em>Ledger add-on</em>
            <h3>$0.75 / PC / month</h3>
            <p>Sealed hashes for Meera and Vikram. On top of Core, not instead of Defender.</p>
          </article>
        </div>
      </div>
      <div className="tri tight">
        <article>
          <em>Bottom-left · cheap and blind</em>
          <p>
            Defender P1 ~$3. Falcon Go ~$5. Fine as a bouncer. Packed Photos walks in dressed as a
            photo app. That is the cheap they already own.
          </p>
        </article>
        <article>
          <em>Far right · high cost, still toast</em>
          <p>
            Falcon Enterprise ~$15/PC/mo ($185/yr). S1 Complete similar. 500 PCs ≈ $90k/year — and
            they still pay humans $20–45 to say “not a fire.”
          </p>
        </article>
        <article className="ours">
          <em>Top-left · cheaper, way better</em>
          <p>
            Keep Defender. Add us. Overlay $3, or ~$6 if P1 is on the bill. Same stream, a world
            model, fewer dumb looks. Not a second agent war.
          </p>
        </article>
      </div>
      <p className="fine">
        X is published list (Microsoft P1 $3 / P2 $5.20; CrowdStrike Go $60/yr, Enterprise $185/yr;
        S1 Complete ~$180/yr). Y is the same judgment as the coord slide — packed-file catch + SOC
        sanity — not a vendor quote. Volume deals are lower. Hidden cost is still the $20–45 look.
      </p>
    </section>
  );
}

function Gtm() {
  return (
    <section className="slide">
      <p className="kicker">Go to market · no mystery</p>
      <h2>Show the two movies. Then sell the overlay.</h2>
      <GtmGraphic />
      <div className="tri">
        <article>
          <em>Door 1</em>
          <h3>One angry SOC lead</h3>
          <p>
            Ananya’s world: fintech / campus / hospital IT. They already have AV. We plug the lab
            into their export. If PhotoViewer.crypt does not land, we do not deserve the meeting.
          </p>
        </article>
        <article>
          <em>Door 2</em>
          <h3>One MSSP with twelve tenants</h3>
          <p>
            Rahul’s world. He sells minutes. India managed security is the fast lane (+15% in 2026,
            Gartner). Same brain, many logos.
          </p>
        </article>
        <article className="ours">
          <em>The move</em>
          <h3>Demo is the sales team</h3>
          <p>
            Photos opens. Dummy ransom hits the chain. Active Inference skips the dumb look. That
            is the GTM. Slides are just the map.
          </p>
        </article>
      </div>
    </section>
  );
}

function GtmGraphic() {
  return (
    <figure className="gtm-art" aria-label="Two doors into a live demo, then the overlay sale">
      <svg viewBox="0 0 960 220" role="img">
        <text x="88" y="22" className="gtm-cap">Door 1</text>
        <rect x="24" y="32" width="128" height="150" rx="10" className="gtm-door soc" />
        <rect x="40" y="48" width="96" height="118" rx="6" className="gtm-panel" />
        <circle cx="88" cy="88" r="16" className="gtm-face" />
        <path d="M72 128c8 14 24 14 32 0" className="gtm-line" />
        <text x="88" y="168" className="gtm-label">Ananya</text>
        <text x="88" y="196" className="gtm-sub">SOC · 220 PCs</text>

        <text x="280" y="22" className="gtm-cap">Door 2</text>
        <rect x="216" y="32" width="128" height="150" rx="10" className="gtm-door mssp" />
        <rect x="232" y="48" width="96" height="118" rx="6" className="gtm-panel" />
        <circle cx="280" cy="80" r="14" className="gtm-face gold" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={242 + (i % 2) * 34} y={108 + Math.floor(i / 2) * 22} width="28" height="16" rx="3" className="gtm-tenant" />
        ))}
        <text x="280" y="168" className="gtm-label">Rahul</text>
        <text x="280" y="196" className="gtm-sub">MSSP · 12 tenants</text>

        <path d="M162 108h40" className="gtm-arrow" />
        <path d="M354 108h40" className="gtm-arrow" />
        <polygon points="200,108 190,103 190,113" className="gtm-head" />
        <polygon points="392,108 382,103 382,113" className="gtm-head" />

        <text x="532" y="22" className="gtm-cap">The two movies</text>
        <rect x="404" y="36" width="256" height="148" rx="12" className="gtm-screen" />
        <rect x="418" y="50" width="110" height="88" rx="8" className="gtm-win hot" />
        <text x="473" y="88" className="gtm-mini">Photos</text>
        <text x="473" y="106" className="gtm-mini dim">AV CLEAN</text>
        <rect x="536" y="50" width="110" height="88" rx="8" className="gtm-win ok" />
        <text x="591" y="80" className="gtm-mini">LOCK-NOTE</text>
        <text x="591" y="98" className="gtm-mini dim">write</text>
        <text x="591" y="116" className="gtm-mini ok">DENIED</text>
        <text x="532" y="168" className="gtm-label">Live demo is the close</text>
        <text x="532" y="196" className="gtm-sub">If this flops, stop talking</text>

        <path d="M670 108h44" className="gtm-arrow" />
        <polygon points="712,108 702,103 702,113" className="gtm-head" />

        <text x="820" y="22" className="gtm-cap">Then the layer</text>
        <rect x="724" y="36" width="212" height="148" rx="12" className="gtm-sale" />
        <text x="830" y="78" className="gtm-price">$3</text>
        <text x="830" y="100" className="gtm-sub">/ PC / month · SOC</text>
        <text x="830" y="132" className="gtm-price sm">$1.50</text>
        <text x="830" y="154" className="gtm-sub">wholesale · MSSP</text>
        <text x="830" y="186" className="gtm-sub">+$0.75 ledger if they want seals</text>
      </svg>
    </figure>
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
          <p>Sneaky files look clean. Normal work looks sneaky. Those four buyers pay for both mistakes.</p>
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
  customers: Customers,
  trl: Trl,
  samsom: Samsom,
  biz: Biz,
  gtm: Gtm,
  close: Close,
};
