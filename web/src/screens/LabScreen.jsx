import { useEffect, useMemo, useRef, useState } from "react";
import {
  SCENARIOS,
  applyThresholds,
  loadCampaign,
  nearestStealth,
  raceText,
} from "../lib/campaigns";

const POS = {
  attacker: { x: 90, y: 140 },
  workstation: { x: 430, y: 250 },
  fileserver: { x: 640, y: 180 },
  dc: { x: 640, y: 330 },
  vault: { x: 860, y: 250 },
};

const COLORS = {
  probe: "#5ce1e6",
  fingerprint: "#7dd3c7",
  scan: "#e9b14a",
  exfil: "#ff5d6c",
  steal: "#ff5d6c",
  beacon: "#ff8fab",
  pivot: "#c77dff",
  creds: "#c77dff",
  spawn: "#3ee0a0",
  drop: "#8eae9a",
  auth: "#e9b14a",
  benign: "#3ee0a0",
};

const BELIEFS = [
  "normal",
  "suspicious_execution",
  "persistence",
  "credential_access",
  "lateral_movement",
  "command_and_control",
  "compromised",
];

const EMPTY_IMPACT = {
  hosts_discovered: 0,
  services_fingerprinted: 0,
  ports_probed: 0,
  files_touched: 0,
  mb_exfiltrated: 0,
  credentials_touched: 0,
  hosts_pivoted: 0,
};

export default function LabScreen() {
  const [scenario, setScenario] = useState("full_chain");
  const [stealth, setStealth] = useState(35);
  const [speed, setSpeed] = useState(10);
  const [mlTh, setMlTh] = useState(50);
  const [nsTh, setNsTh] = useState(24);
  const [noise, setNoise] = useState(false);
  const [index, setIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [log, setLog] = useState([]);
  const [nodes, setNodes] = useState({});
  const [packets, setPackets] = useState([]);
  const timer = useRef(null);
  const packetId = useRef(0);

  const campaign = useMemo(
    () => applyThresholds(loadCampaign(scenario, stealth, noise), mlTh / 100, nsTh / 100),
    [scenario, stealth, noise, mlTh, nsTh]
  );
  const frame = index >= 0 ? campaign.frames[index] : null;

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!running) return;
    if (index + 1 >= campaign.frames.length) {
      setRunning(false);
      setFinished(true);
      return;
    }
    timer.current = setTimeout(() => applyNext(index + 1), 2200 / (speed / 10));
    return () => clearTimeout(timer.current);
  }, [running, index, speed, campaign.frames.length]);

  function resetVisuals() {
    setIndex(-1);
    setFinished(false);
    setLog([]);
    setNodes({});
    setPackets([]);
  }

  function launch() {
    resetVisuals();
    setRunning(true);
    applyNext(0);
  }

  function applyNext(nextIndex) {
    const next = campaign.frames[nextIndex];
    if (!next) {
      setRunning(false);
      setFinished(true);
      return;
    }
    setIndex(nextIndex);
    setNodes((prev) => markNodes(prev, next));
    spawnPacket(next);
    setLog((prev) => [
      `t=${next.index} · ${next.stage} · ${next.title} · XGB ${next.ml_risk.toFixed(2)}${next.ml_alert ? " ALERT" : ""} · NS ${next.ns_score.toFixed(2)}${next.ns_alert ? " ALERT" : ""}`,
      ...prev,
    ]);
    if (nextIndex + 1 >= campaign.frames.length) {
      setRunning(false);
      setFinished(true);
    }
  }

  function spawnPacket(next) {
    const a = POS[next.source];
    const b = POS[next.target];
    if (!a || !b) return;
    const id = packetId.current++;
    setPackets((prev) => [
      ...prev,
      {
        id,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        color: COLORS[next.visual] || "#3ee0a0",
        r: next.visual === "exfil" ? 7 : 5,
        label: next.stolen_name ? `STEAL ${next.stolen_name}` : null,
        t: 0,
      },
    ]);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 700);
      setPackets((prev) => prev.map((item) => (item.id === id ? { ...item, t: p } : item)));
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => setPackets((prev) => prev.filter((item) => item.id !== id)), 250);
    };
    requestAnimationFrame(tick);
  }

  function stepOnce() {
    if (index + 1 >= campaign.frames.length) {
      setFinished(true);
      return;
    }
    setRunning(false);
    applyNext(index + 1);
  }

  const impact = frame?.impact || EMPTY_IMPACT;
  const verdict = finished
    ? raceText(campaign.race)
    : `${campaign.meta.specimen}: ${campaign.meta.blurb}`;

  return (
    <>
      <header className="top">
        <div>
          <p className="kicker">Isolated lab · dummy implant · static React host</p>
          <h1>Live campaign vs detectors</h1>
        </div>
        <div className="top-actions">
          <button className="primary" onClick={launch}>
            Launch dummy malware
          </button>
          <button disabled={index < 0} onClick={() => setRunning((value) => !value)}>
            {running ? "Pause" : "Resume"}
          </button>
          <button disabled={index < 0} onClick={stepOnce}>
            Step
          </button>
        </div>
      </header>
      <main className="layout">
        <aside className="panel controls">
          <h2>Specimen</h2>
          <div className="cards">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                className={scenario === item.id ? "card active" : "card"}
                onClick={() => setScenario(item.id)}
              >
                <strong>{item.specimen}</strong>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <h2>Parameters</h2>
          <label>
            Stealth <output>{nearestStealth(stealth)}</output>
          </label>
          <input type="range" min="0" max="90" value={stealth} onChange={(e) => setStealth(Number(e.target.value))} />
          <label>
            Playback speed <output>{(speed / 10).toFixed(1)}×</output>
          </label>
          <input type="range" min="4" max="20" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
          <label>
            XGBoost threshold <output>{(mlTh / 100).toFixed(2)}</output>
          </label>
          <input type="range" min="20" max="90" value={mlTh} onChange={(e) => setMlTh(Number(e.target.value))} />
          <label>
            World-model threshold <output>{(nsTh / 100).toFixed(2)}</output>
          </label>
          <input type="range" min="10" max="60" value={nsTh} onChange={(e) => setNsTh(Number(e.target.value))} />
          <label className="check">
            <input type="checkbox" checked={noise} onChange={(e) => setNoise(e.target.checked)} />
            Mix benign office noise
          </label>
          <p className="hint">
            Runs entirely in the browser from precomputed detector traces. Stealth snaps to 0 / 20 / 35 / 50 / 70 / 90.
          </p>
        </aside>

        <section className="stage">
          <div className="impact">
            <Stat label="Hosts found" value={impact.hosts_discovered} />
            <Stat label="Fingerprints" value={impact.services_fingerprinted} />
            <Stat label="Ports probed" value={impact.ports_probed} />
            <Stat label="Files touched" value={impact.files_touched} />
            <Stat label="Data stolen" value={`${impact.mb_exfiltrated} MB`} hot />
            <Stat label="Creds touched" value={impact.credentials_touched} />
            <Stat label="Pivots" value={impact.hosts_pivoted} />
          </div>
          <NetworkMap nodes={nodes} packets={packets} />
          <div className="now">
            <span className="stage-tag">{frame?.stage || "idle"}</span>
            <div>
              <strong>{frame?.title || "Waiting to launch"}</strong>
              <p>{frame?.narrative || "Pick a dummy specimen and parameters, then launch."}</p>
            </div>
          </div>
          <ol className="log">
            {log.map((line, i) => (
              <li key={`${line}-${i}`}>{line}</li>
            ))}
          </ol>
        </section>

        <aside className="panel detectors">
          <div className="detector xgb">
            <h2>XGBoost</h2>
            <div className="meter">
              <span style={{ width: `${Math.min(100, (frame?.ml_risk || 0) * 100)}%` }} />
            </div>
            <p className="score">{(frame?.ml_risk || 0).toFixed(2)}</p>
            <p className={`status${frame?.ml_alert ? " hot" : ""}`}>{frame?.ml_alert ? "ALERT" : "quiet"}</p>
          </div>
          <div className="detector ns">
            <h2>Neuro-symbolic</h2>
            {(frame ? BELIEFS : []).map((key) => (
              <div className="belief-row" key={key}>
                <span>{key.replaceAll("_", " ")}</span>
                <b>
                  <i style={{ width: `${((frame?.belief?.[key] || 0) * 100).toFixed(0)}%` }} />
                </b>
              </div>
            ))}
            <p className={`status${frame?.ns_alert ? " hot" : ""}`}>{frame?.ns_alert ? "ALERT" : "quiet"}</p>
            <p className="action">action: {frame?.action || "do_nothing"}</p>
            <ul className="rules">
              {(frame?.rules || []).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
          <div className="verdict">{verdict}</div>
        </aside>
      </main>
    </>
  );
}

function Stat({ label, value, hot }) {
  return (
    <div className={hot ? "hot" : undefined}>
      <em>{label}</em>
      <strong>{value}</strong>
    </div>
  );
}

function markNodes(prev, frame) {
  const next = { ...prev };
  const add = (id, cls) => {
    next[id] = { ...(next[id] || {}), [cls]: true };
  };
  if (frame.visual === "probe" || frame.visual === "fingerprint") add(frame.target, "discovered");
  if (frame.visual === "scan") add(frame.target, "probed");
  if (["creds", "pivot", "exfil", "steal"].includes(frame.visual)) {
    add(frame.source, "compromised");
    add(frame.target, "compromised");
  }
  if (frame.visual === "exfil" || frame.visual === "steal") add("vault", "stolen");
  if (frame.ns_alert) add("workstation", "contained");
  return next;
}

function NetworkMap({ nodes, packets }) {
  const classOf = (id) =>
    ["node", ...Object.keys(nodes[id] || {}).filter((key) => nodes[id][key])].join(" ");
  return (
    <svg className="map" viewBox="0 0 1100 520" role="img" aria-label="Lab network map">
      <defs>
        <linearGradient id="link" x1="0" x2="1">
          <stop offset="0%" stopColor="#3d5a4c" />
          <stop offset="100%" stopColor="#1f3329" />
        </linearGradient>
      </defs>
      <path className="edge" d="M160,160 C280,160 300,250 430,250" />
      <path className="edge" d="M430,250 L640,180" />
      <path className="edge" d="M430,250 L640,330" />
      <path className="edge" d="M640,180 L860,250" />
      <path className="edge" d="M640,330 L860,250" />
      {Object.entries(POS).map(([id, pos]) => (
        <g key={id} className={classOf(id)} transform={`translate(${pos.x},${pos.y})`}>
          <circle r={id === "workstation" || id === "vault" ? 38 : 34} />
          <text y="4">{LABELS[id].short}</text>
          <text className="label" y="56">
            {LABELS[id].long}
          </text>
        </g>
      ))}
      {packets.map((p) => {
        const x = p.x1 + (p.x2 - p.x1) * p.t;
        const y = p.y1 + (p.y2 - p.y1) * p.t;
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r={p.r} fill={p.color} />
            {p.label && (
              <text className="file-chip" x={(p.x1 + p.x2) / 2} y={(p.y1 + p.y2) / 2 - 12} textAnchor="middle">
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const LABELS = {
  attacker: { short: "ATK", long: "Dummy C2" },
  workstation: { short: "PC", long: "alice-pc" },
  fileserver: { short: "FS", long: "fileserver" },
  dc: { short: "DC", long: "dc-01" },
  vault: { short: "VAULT", long: "finance share" },
};
