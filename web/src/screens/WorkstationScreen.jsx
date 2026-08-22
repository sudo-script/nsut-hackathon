import { useEffect, useMemo, useRef, useState } from "react";
import { AssemblyTape } from "../components/AssemblyTape.jsx";
import { AV_STEPS, AvTray, ClassicAvWindow, classicAvResult } from "../components/ClassicAv.jsx";
import { HostAppWindow } from "../components/HostApps.jsx";
import { DESKTOP_FILES } from "../data/workstation";
import { applyThresholds, loadCampaign } from "../lib/campaigns";

const BIOS_STEPS = [
  "UEFI POST",
  "Secure Boot keys",
  "Measure payload hash",
  "Signature check",
  "Firmware policy",
  "Divert to sandbox",
];

export default function WorkstationScreen() {
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [biosStep, setBiosStep] = useState(0);
  const [frameIndex, setFrameIndex] = useState(-1);
  const [promoted, setPromoted] = useState({});
  const [blocked, setBlocked] = useState({});
  const [processes, setProcesses] = useState([]);
  const [packets, setPackets] = useState([]);
  const [openApps, setOpenApps] = useState([]);
  const [avStep, setAvStep] = useState(0);
  const timer = useRef(null);

  const campaign = useMemo(() => {
    if (!selected?.scenario) return null;
    return applyThresholds(loadCampaign(selected.scenario, 35, false), 0.5, 0.24);
  }, [selected]);

  const frame = campaign && frameIndex >= 0 ? campaign.frames[frameIndex] : null;

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (phase !== "av" || !selected) return;
    if (avStep >= AV_STEPS.length) {
      timer.current = setTimeout(() => {
        setPhase("bios");
        setBiosStep(0);
      }, 700);
      return;
    }
    timer.current = setTimeout(() => setAvStep((n) => n + 1), 400);
    return () => clearTimeout(timer.current);
  }, [phase, avStep, selected]);

  useEffect(() => {
    if (phase !== "bios" || !selected) return;
    if (biosStep >= BIOS_STEPS.length) {
      timer.current = setTimeout(() => {
        setPhase("sandbox");
        if (selected.localOnly || selected.app) {
          setProcesses([{ name: selected.processName || "app.exe", title: selected.name }]);
          setTimeout(() => finishRun(selected, selected.promote === "allow"), selected.app ? 1400 : 1600);
        } else {
          setFrameIndex(0);
        }
      }, 400);
      return;
    }
    timer.current = setTimeout(() => setBiosStep((n) => n + 1), 420);
    return () => clearTimeout(timer.current);
  }, [phase, biosStep, selected]);

  useEffect(() => {
    if (phase !== "sandbox" || !campaign || selected?.localOnly) return;
    if (frameIndex < 0) return;
    const current = campaign.frames[frameIndex];
    if (current) {
      setProcesses((prev) => rememberProcess(prev, current));
      if (isNetwork(current)) {
        setPackets((prev) => [
          {
            id: `${current.index}-${current.visual}`,
            src: current.source,
            dst: current.target,
            stage: current.stage,
            title: current.title,
            stolen: current.stolen_name,
            alert: current.ns_alert || current.ml_alert,
          },
          ...prev,
        ].slice(0, 10));
      }
    }
    if (frameIndex + 1 >= campaign.frames.length) {
      timer.current = setTimeout(() => finishRun(selected, selected.promote === "allow"), 900);
      return;
    }
    timer.current = setTimeout(() => setFrameIndex((n) => n + 1), 1100);
    return () => clearTimeout(timer.current);
  }, [phase, frameIndex, campaign, selected]);

  function openFile(file) {
    clearTimeout(timer.current);
    setSelected(file);
    setPhase("av");
    setAvStep(0);
    setBiosStep(0);
    setFrameIndex(-1);
    setProcesses([]);
    setPackets([]);
  }

  function finishRun(file, allow) {
    setPhase(allow ? "allowed" : "blocked");
    if (allow) {
      setPromoted((prev) => ({ ...prev, [file.id]: true }));
      if (file.app) {
        setOpenApps((prev) => (prev.some((item) => item.id === file.id) ? prev : [...prev, file]));
      }
    } else {
      setBlocked((prev) => ({ ...prev, [file.id]: true }));
    }
  }

  const decision =
    phase === "allowed"
      ? "ALLOWED on main machine after sandbox"
      : phase === "blocked"
        ? "BLOCKED from main machine — remains in sandbox quarantine"
        : phase === "av"
          ? "Classic AV is doing scan-time + run-time only"
          : phase === "bios"
            ? "Firmware gate — host execute is denied until sandbox returns"
            : phase === "sandbox"
              ? "Executing only inside the isolated sandbox"
              : "Double-click a desktop file. It cannot run on the host first.";

  return (
    <div className="ws-shell">
      <div className="ws-split">
        <section className="win-bezel">
          <div className="win-desktop">
            <div className="win-icons">
              {DESKTOP_FILES.map((file) => (
                <button
                  key={file.id}
                  className={`win-icon ${file.promote === "allow" ? "safe" : "unsafe"} ${promoted[file.id] ? "cleared" : ""} ${blocked[file.id] ? "quarantined" : ""}`}
                  onDoubleClick={() => openFile(file)}
                  onClick={() => openFile(file)}
                >
                  <span className="win-glyph" style={{ background: file.color }}>
                    {file.icon}
                  </span>
                  <em>{file.name}</em>
                  <small className={file.promote === "allow" ? "" : "bad"}>
                    {promoted[file.id]
                      ? "running"
                      : blocked[file.id]
                        ? "blocked"
                        : file.obfuscated
                          ? "obfuscated dummy"
                          : file.promote === "allow"
                            ? "safe"
                            : "dummy malware"}
                  </small>
                </button>
              ))}
            </div>

            {phase === "allowed" &&
              openApps.map((file, index) => (
                <HostAppWindow
                  key={file.id}
                  file={file}
                  offset={index}
                  onClose={() => setOpenApps((prev) => prev.filter((item) => item.id !== file.id))}
                />
              ))}

            {(phase === "sandbox" || phase === "blocked") && selected && (
              <div className={`vm-window ${phase === "blocked" ? "hot" : ""}`}>
                <div className="vm-title">
                  <span>SANDBOX — Windows 11 (isolated)</span>
                  <span className="vm-tag">no host disk · no host NIC · snapshot</span>
                </div>
                <div className="vm-body">
                  <div className="vm-apps">
                    {(processes.length ? processes : [{ name: "explorer.exe", title: "Desktop" }]).map((proc) => (
                      <div key={proc.name + proc.title} className="vm-app">
                        <strong>{proc.name}</strong>
                        <span>{proc.title}</span>
                      </div>
                    ))}
                  </div>
                  <div className="vm-event">
                    <p className="vm-kicker">{frame?.stage || selected.specimen || "preview"}</p>
                    <h3>{frame?.title || selected.name}</h3>
                    <p>{frame?.narrative || selected.sandboxNote || "Signed document preview. No implant chain."}</p>
                    {frame?.stolen_name && <p className="steal">SANDBOX COPY: {frame.stolen_name}</p>}
                  </div>
                </div>
              </div>
            )}

            <ClassicAvWindow file={selected} step={avStep} visible={Boolean(selected) && phase !== "idle"} />

            {phase === "bios" && selected && (
              <div className="bios-overlay">
                <p className="bios-brand">UEFI Measured Execution · alice-pc</p>
                <h2>Firmware policy gate</h2>
                <p className="bios-note">
                  Simulated pre-OS control. The host Windows kernel is not given this file until the sandbox returns.
                </p>
                <pre>
{`Payload : ${selected.name}
SHA-256 : ${selected.hash}
Signed  : ${selected.signed ? "YES  " + selected.publisher : "NO   unsigned"}
Allowlist: ${selected.bios.allowlisted ? "HIT" : "MISS"}
Secure Boot: ${selected.bios.secureBoot ? "ON" : "OFF"}`}
                </pre>
                <ol>
                  {BIOS_STEPS.map((step, i) => (
                    <li key={step} className={i < biosStep ? "done" : i === biosStep ? "now" : ""}>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="bios-reason">{selected.bios.reason}</p>
              </div>
            )}

            <div className="win-taskbar">
              <span className="start">⊞</span>
              <span className="pill">alice-pc · MAIN OS</span>
              {openApps.map((file) => (
                <span key={file.id} className="pill">
                  {file.windowTitle || file.name}
                </span>
              ))}
              {selected && !openApps.some((file) => file.id === selected.id) && (
                <span className="pill dim">{selected.name}</span>
              )}
              <AvTray file={selected} phase={phase} />
              {selected && phase !== "idle" && phase !== "av" && (
                <span className={`pill ${phase === "blocked" || frame?.ns_alert ? "hot" : phase === "allowed" ? "" : "dim"}`}>
                  NS {phase === "blocked" || frame?.ns_alert ? "ALERT" : phase === "allowed" ? "ALLOW" : "watch"}
                </span>
              )}
              <span className="clock">11:24 AM</span>
            </div>
          </div>
        </section>

        <aside className="sec-backend">
          <h2>Security layer (backend)</h2>
          <p className="sec-path">Classic AV (scan + run) vs firmware + assembly behavior + world model</p>
          {selected && (
            <div className="vs-strip">
              <div className={`vs ${classicAvResult(selected).bypassed ? "miss" : classicAvResult(selected).scan === "THREAT" ? "hit" : "ok"}`}>
                <em>Classic AV</em>
                <strong>
                  {classicAvResult(selected).bypassed
                    ? "BYPASSED"
                    : classicAvResult(selected).scan}
                </strong>
                <span>scan-time + run-time only</span>
              </div>
              <div className={`vs ${phase === "blocked" ? "hit" : phase === "allowed" ? "ok" : "live"}`}>
                <em>Neuro-symbolic</em>
                <strong>{phase === "blocked" ? "DETECT" : phase === "allowed" ? "ALLOW" : "WATCH"}</strong>
                <span>UEFI + sandbox assembly/behavior</span>
              </div>
            </div>
          )}

          <BackendCard title="Firmware / BIOS policy" tone={phase === "bios" ? "live" : selected ? "ok" : ""}>
            {selected ? (
              <>
                <Row k="Measurement" v={selected.hash.slice(0, 16) + "…"} />
                <Row k="Allow-list" v={selected.bios.allowlisted ? "known" : "unknown"} warn={!selected.bios.allowlisted} />
                <Row k="Host execute" v={phase === "allowed" ? "permitted" : "denied until verdict"} warn={phase !== "allowed"} />
              </>
            ) : (
              <p>Waiting for a desktop file.</p>
            )}
          </BackendCard>

          <BackendCard title="Hash + signature" tone={selected && !selected.signed ? "hot" : selected?.signed ? "ok" : ""}>
            {selected ? (
              <>
                <Row k="SHA-256" v={selected.hash} mono />
                <Row k="Signature" v={selected.signed ? `Valid · ${selected.publisher}` : "Missing / untrusted"} warn={!selected.signed} />
                <Row k="Reputation" v={selected.reputation} />
              </>
            ) : (
              <p>No sample loaded.</p>
            )}
          </BackendCard>

          <BackendCard title="Sandbox packet monitor" tone={packets.some((p) => p.alert) ? "hot" : packets.length ? "live" : ""}>
            {packets.length === 0 ? (
              <p>No sandbox egress yet. Host NIC is still dark.</p>
            ) : (
              <ul className="pkt">
                {packets.map((p) => (
                  <li key={p.id} className={p.alert ? "alert" : ""}>
                    <span>{p.src} → {p.dst}</span>
                    <em>{p.stolen ? `exfil ${p.stolen}` : p.title}</em>
                  </li>
                ))}
              </ul>
            )}
          </BackendCard>

          <AssemblyTape file={selected} frame={frame} phase={phase} />

          <BackendCard title="World model + XGBoost" tone={frame?.ns_alert ? "hot" : frame || selected?.promote === "allow" ? "live" : ""}>
            {frame ? (
              <>
                <Row k="XGBoost" v={frame.ml_risk.toFixed(2) + (frame.ml_alert ? " ALERT" : "")} warn={frame.ml_alert} />
                <Row k="NS score" v={frame.ns_score.toFixed(2) + (frame.ns_alert ? " ALERT" : "")} warn={frame.ns_alert} />
                <Row k="Action" v={frame.action} />
                <ul className="rules">
                  {(frame.rules || []).map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </>
            ) : selected?.promote === "allow" && phase !== "idle" ? (
              <>
                <Row k="XGBoost" v="0.04 quiet" />
                <Row k="NS score" v="normal · no attack stage" />
                <Row k="Action" v="do_nothing" />
                <p>Signed allow-listed app. No rare outbound, no script spawn from Office.</p>
              </>
            ) : (
              <p>Detectors attach after firmware hands the file to the sandbox.</p>
            )}
          </BackendCard>

          <div className={`sec-verdict ${phase}`}>
            <strong>{decision}</strong>
            {phase === "allowed" && (
              <p>
                {selected?.app
                  ? `${selected.windowTitle || selected.name} is open on the host. Draw, type, or click — this binary was signed, hashed, and sandbox-tested.`
                  : "Promoted to the main desktop. Host still did not run the raw first copy."}
              </p>
            )}
            {phase === "blocked" && (
              <p>
                {selected?.obfuscated
                  ? "Classic AV stayed CLEAN because the on-disk sample is packed. The world model still blocked host execute from sandbox behavior (temp execution, rare outbound, theft indicators)."
                  : "Main OS never received an executable mapping. Snapshot can be discarded."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function BackendCard({ title, tone, children }) {
  return (
    <section className={`sec-card ${tone || ""}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Row({ k, v, warn, mono }) {
  return (
    <p className={`sec-row ${warn ? "warn" : ""}`}>
      <span>{k}</span>
      <code className={mono ? "mono" : ""}>{v}</code>
    </p>
  );
}

function isNetwork(frame) {
  return ["probe", "scan", "exfil", "beacon", "auth", "steal"].includes(frame.visual) || frame.event_type === "NetworkEvent";
}

function rememberProcess(prev, frame) {
  const name =
    frame.event_type === "ProcessEvent"
      ? frame.title.split(" ").slice(-1)[0]
      : frame.source === "workstation"
        ? "powershell.exe"
        : null;
  const next = { name: name || "sysmon.exe", title: frame.title };
  const exists = prev.some((item) => item.title === next.title);
  return exists ? prev : [next, ...prev].slice(0, 5);
}

