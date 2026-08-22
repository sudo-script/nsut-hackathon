import { useRef, useState } from "react";
import {
  AUTHORITIES,
  DUMMY_NOTE,
  GENESIS,
  RANSOM_STEPS,
  SEALED_FILES,
  authorityName,
  authorityOf,
} from "../data/ledger";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function FirmwareLedgerScreen() {
  const [step, setStep] = useState(-1);
  const [phase, setPhase] = useState("idle");
  const [locked, setLocked] = useState({});
  const [denied, setDenied] = useState({});
  const [blocks, setBlocks] = useState(GENESIS);
  const [log, setLog] = useState([]);
  const runId = useRef(0);

  const current = step >= 0 ? RANSOM_STEPS[step] : null;
  const done = phase === "done";

  async function play() {
    runId.current += 1;
    const token = runId.current;
    const alive = () => runId.current === token;

    setStep(-1);
    setLocked({});
    setDenied({});
    setBlocks(GENESIS);
    setLog([]);
    setPhase("boot");
    pushLog("UEFI POST · measure firmware · load file-seal chain");
    await wait(700);
    if (!alive()) return;
    setPhase("ready");
    pushLog("Ledger verified. 4 authorities. 6 sealed objects. Write trap armed.");
    await wait(500);
    if (!alive()) return;

    setPhase("attack");
    for (let i = 0; i < RANSOM_STEPS.length; i += 1) {
      if (!alive()) return;
      const item = RANSOM_STEPS[i];
      setStep(i);
      if (item.file && item.file !== "note") {
        setLocked((prev) => ({ ...prev, [item.file]: true }));
        setDenied((prev) => ({ ...prev, [item.file]: true }));
        const file = SEALED_FILES.find((row) => row.id === item.file);
        setBlocks((prev) => [...prev, denyBlock(prev.length, file)]);
        pushLog(`WRITE TRAP  ${file.name}  writer=LOCK-NOTE.dummy  sig=NONE  → DENY`);
      } else if (item.file === "note") {
        setLocked((prev) => ({ ...prev, note: true }));
        setDenied((prev) => ({ ...prev, note: true }));
        setBlocks((prev) => [...prev, denyBlock(prev.length, DUMMY_NOTE)]);
        pushLog("WRITE TRAP  README_LOCK.txt  unsigned create  → DENY");
      } else {
        pushLog("Unsigned dummy process measured. Not on the authority ledger.");
      }
      await wait(700);
    }
    if (!alive()) return;
    setPhase("done");
    pushLog("Without layer: files appear locked (UI only). With layer: golden hashes unchanged.");
  }

  function reset() {
    runId.current += 1;
    setStep(-1);
    setPhase("idle");
    setLocked({});
    setDenied({});
    setBlocks(GENESIS);
    setLog([]);
  }

  function pushLog(line) {
    setLog((prev) => [line, ...prev].slice(0, 8));
  }

  return (
    <div className="fw-shell">
      <header className="fw-head">
        <div>
          <p className="kicker">Simulated UEFI file-seal · dummy ransom only</p>
          <h1>BIOS authority ledger vs dummy ransom</h1>
          <p>
            Golden hashes are sealed by enrolled authorities on an append-only lab chain. A process
            may rewrite a file only if its signature verifies to a parent on that chain. LOCK-NOTE.dummy
            encrypts nothing on disk — the left PC is a visual lock, the right PC is the write trap.
          </p>
        </div>
        <div className="fw-actions">
          <button type="button" className="primary" onClick={play}>
            Launch dummy ransom
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      <div className="fw-pcs">
        <Desktop
          title="WITHOUT firmware ledger"
          tag="host writes allowed"
          hot
          files={SEALED_FILES}
          locked={locked}
          denied={{}}
          showNote={locked.note}
          current={current?.file}
        />
        <Desktop
          title="WITH firmware ledger"
          tag="write trap + authority chain"
          files={SEALED_FILES}
          locked={{}}
          denied={denied}
          showNote={false}
          current={current?.file}
          protected
        />
      </div>

      <div className="fw-lower">
        <section className="fw-bios">
          <h2>UEFI write trap</h2>
          <pre>
{`Secure Boot     ON
File-seal chain ${blocks.length} blocks
Authorities     ${AUTHORITIES.length} enrolled
Current step    ${current ? current.title : "idle — launch the dummy ransom"}
Decision        ${
  !current
    ? "—"
    : current.file
      ? "DENY — writer has no ledger grant"
      : "MEASURE — unsigned dummy process"
}`}
          </pre>
          <ol>
            {log.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <section className="fw-auth">
          <h2>Authorities</h2>
          {AUTHORITIES.map((item) => (
            <article key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.role}</span>
              <code>{item.key}</code>
            </article>
          ))}
        </section>

        <section className="fw-chain">
          <h2>Lab ledger</h2>
          <div className="chain">
            {blocks.map((block) => (
              <article key={`${block.height}-${block.hash}`} className={block.type}>
                <em>
                  #{block.height} · {block.type}
                </em>
                <strong>{block.title}</strong>
                <p>{block.detail}</p>
                <code>{block.hash.slice(0, 22)}…</code>
              </article>
            ))}
          </div>
        </section>
      </div>

      <p className={`fw-verdict ${done ? (denied.notes ? "ok" : "hot") : ""}`}>
        {done
          ? "Dummy run finished. Left: visual lock (no ledger). Right: every overwrite denied; sealed hashes still match Alice / IT / Microsoft."
          : phase === "attack"
            ? `${current?.title || "Attacking"} — left PC shows the lock the dummy wants. Right PC refuses the write.`
            : "Launch to race the same dummy ransom on both PCs."}
      </p>
    </div>
  );
}

function Desktop({ title, tag, hot, files, locked, denied, showNote, current, protected: isProtected }) {
  return (
    <section className={`fw-pc ${hot ? "hot" : ""} ${isProtected ? "safe" : ""}`}>
      <header>
        <span>{title}</span>
        <small>{tag}</small>
      </header>
      <div className={`fw-desk ${showNote ? "ransom" : ""}`}>
        <div className="fw-icons">
          {files.map((file) => {
            const isLocked = locked[file.id];
            const isDenied = denied[file.id];
            const active = current === file.id;
            return (
              <div
                key={file.id}
                className={`fw-file ${isLocked ? "locked" : ""} ${isDenied ? "denied" : ""} ${active ? "now" : ""}`}
              >
                <span style={{ background: file.color }}>{file.icon}</span>
                <em>{isLocked ? `${file.name}.locked` : file.name}</em>
                <small>
                  {isLocked
                    ? "dummy lock"
                    : isDenied
                      ? "write denied"
                      : authorityName(file.authority)}
                </small>
              </div>
            );
          })}
        </div>
        {showNote && (
          <aside className="fw-note">
            <strong>LOCK-NOTE · dummy</strong>
            <p>Your files appear locked in this UI. This is not encryption. No key, no Bitcoin, no real ransom.</p>
          </aside>
        )}
        {isProtected && Object.keys(denied).length > 0 && (
          <aside className="fw-shield">
            <strong>Firmware denied the writer</strong>
            <p>
              {current && current !== "note"
                ? `${SEALED_FILES.find((row) => row.id === current)?.name || ""} stays at ${authorityOf(SEALED_FILES.find((row) => row.id === current)?.authority || "root").name}`
                : "Sealed objects unchanged. Ledger appended a DENY block."}
            </p>
          </aside>
        )}
        <div className="fw-bar">
          <span>⊞ alice-pc</span>
          <span className="pill">{isProtected ? "UEFI seal ON" : "UEFI seal OFF"}</span>
        </div>
      </div>
    </section>
  );
}

function denyBlock(height, file) {
  return {
    height,
    type: "deny",
    title: `DENY write ${file.name}`,
    detail: "LOCK-NOTE.dummy presented no authority signature. Golden hash kept.",
    authority: "root",
    hash: `ff${height}a91c0e84b15f3a6c80d2e94b71a0c3f58e19d24b7c6a0e91f33d5a18b${String(height).padStart(3, "0")}`,
    prev: "live",
  };
}
