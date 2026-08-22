import { useMemo, useRef, useState } from "react";
import ChainNetwork from "../components/ChainNetwork.jsx";
import { AUTHORITIES, DUMMY_NOTE, RANSOM_STEPS, SEALED_FILES, authorityName, authorityOf } from "../data/ledger";
import {
  LINKS,
  PEERS,
  appendBlock,
  authorizeWrite,
  buildGenesis,
  quorumOf,
  verifyChain,
  voteOnProposal,
} from "../lib/chain";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const GENESIS = buildGenesis();
const GOSSIP = [
  ["alice-pc", "it-ca"],
  ["alice-pc", "msft-ca"],
  ["it-ca", "mssp-a"],
  ["msft-ca", "mssp-b"],
  ["mssp-a", "campus"],
  ["mssp-b", "campus"],
];

export default function FirmwareLedgerScreen() {
  const [step, setStep] = useState(-1);
  const [phase, setPhase] = useState("idle");
  const [locked, setLocked] = useState({});
  const [denied, setDenied] = useState({});
  const [chain, setChain] = useState(GENESIS);
  const [votes, setVotes] = useState([]);
  const [packets, setPackets] = useState([]);
  const [log, setLog] = useState([]);
  const runId = useRef(0);
  const live = useRef(GENESIS);

  const current = step >= 0 ? RANSOM_STEPS[step] : null;
  const done = phase === "done";
  const integrity = useMemo(() => verifyChain(chain), [chain]);
  const tip = chain[chain.length - 1]?.hash || "";
  const quorum = quorumOf(votes);

  async function play() {
    runId.current += 1;
    const token = runId.current;
    const alive = () => runId.current === token;

    live.current = buildGenesis();
    setStep(-1);
    setLocked({});
    setDenied({});
    setChain(live.current);
    setVotes([]);
    setPackets([]);
    setLog([]);
    setPhase("boot");
    pushLog("UEFI POST · load consortium tip · verify prev-hash links");
    await wait(600);
    if (!alive()) return;
    const check = verifyChain(live.current);
    pushLog(
      check.ok
        ? `NETWORK OK  height=${check.height}  tip=${check.tip.slice(0, 16)}…`
        : `NETWORK FAIL  ${check.reason}`
    );
    setPhase("ready");
    await wait(400);
    if (!alive()) return;

    setPhase("attack");
    for (let i = 0; i < RANSOM_STEPS.length; i += 1) {
      if (!alive()) return;
      const item = RANSOM_STEPS[i];
      setStep(i);
      setVotes([]);

      const file =
        item.file && item.file !== "note" ? SEALED_FILES.find((row) => row.id === item.file) : item.file === "note" ? DUMMY_NOTE : null;

      if (file) {
        const decision = authorizeWrite(live.current, {
          fileId: file.id,
          fileHash: file.hash || "unsealed",
          writer: "LOCK-NOTE.dummy",
          signedBy: null,
        });
        const ballots = voteOnProposal({ signedBy: null });
        await gossip(alive, ballots);
        if (!alive()) return;
        const q = quorumOf(ballots);
        setLocked((prev) => ({ ...prev, [file.id]: true }));
        setDenied((prev) => ({ ...prev, [file.id]: true }));
        live.current = appendBlock(live.current, {
          type: "deny",
          title: `DENY write ${file.name}`,
          detail: `${decision.reason}. Quorum ${q.deny}/${q.total} DENY (need ${q.need}). Golden hash stays on the network.`,
          authority: "root",
          fileId: file.id,
          fileHash: file.hash || null,
        });
        setChain(live.current);
        pushLog(
          `PROPOSE write ${file.name} → ${decision.reason} → quorum ${q.deny}/${q.total} DENY · tip ${live.current.at(-1).hash.slice(0, 12)}…`
        );
      } else {
        pushLog("Unsigned dummy process measured. Not an enrolled authority.");
        await wait(500);
      }
    }
    if (!alive()) return;
    setPhase("done");
    setPackets([]);
    pushLog("Network still verifies. Left PC is a visual lock only. Right PC never lost a sealed hash.");
  }

  async function gossip(alive, ballots) {
    let seen = [];
    for (let i = 0; i < GOSSIP.length; i += 1) {
      if (!alive()) return;
      const [from, to] = GOSSIP[i];
      const id = `${from}-${to}-${i}`;
      for (let t = 0.15; t <= 1.001; t += 0.25) {
        if (!alive()) return;
        setPackets([{ id, from, to, t: Math.min(1, t) }]);
        await wait(35);
      }
      seen = uniqueVotes(seen, ballots, from, to);
      setVotes(seen);
    }
    setVotes(ballots);
    setPackets([]);
  }

  function reset() {
    runId.current += 1;
    live.current = buildGenesis();
    setStep(-1);
    setPhase("idle");
    setLocked({});
    setDenied({});
    setChain(live.current);
    setVotes([]);
    setPackets([]);
    setLog([]);
  }

  function pushLog(line) {
    setLog((prev) => [line, ...prev].slice(0, 8));
  }

  return (
    <div className="fw-shell netted">
      <header className="fw-head">
        <div>
          <p className="kicker">Permissioned lab chain · dummy ransom only</p>
          <h1>BIOS hashes on a blockchain network</h1>
          <p>
            File hashes are committed as content-addressed blocks. Six consortium peers gossip each
            write. A 2/3 DENY quorum appends a new block whose <code>prev</code> is the previous
            tip. LOCK-NOTE.dummy has no key, so the network keeps the golden hashes. Left PC has
            no replica — visual lock only. Not a cryptocurrency.
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
          title="WITHOUT network replica"
          tag="hashes live only on disk"
          hot
          files={SEALED_FILES}
          locked={locked}
          denied={{}}
          showNote={locked.note}
          current={current?.file}
        />
        <Desktop
          title="WITH blockchain file-seal"
          tag="6 peers · prev-hash + merkle"
          files={SEALED_FILES}
          locked={{}}
          denied={denied}
          showNote={false}
          current={current?.file}
          protected
        />
      </div>

      <div className="fw-mid">
        <ChainNetwork votes={votes} packets={packets} integrity={integrity} tip={tip} />
        <section className="fw-bios">
          <h2>UEFI + consortium consensus</h2>
          <pre>
{`Peers           ${PEERS.length}  links ${LINKS.length}
Height          ${integrity.height}
Integrity       ${integrity.ok ? "VALID" : integrity.reason}
Quorum          ${votes.length ? `${quorum.deny}/${quorum.total} DENY (need ${quorum.need})` : "idle"}
Tip             ${tip.slice(0, 32)}…
Merkle seals    ${integrity.merkle ? integrity.merkle.slice(0, 32) + "…" : "—"}
Step            ${current ? current.title : "idle — launch dummy ransom"}`}
          </pre>
          <ol>
            {log.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className="fw-lower slim">
        <section className="fw-auth">
          <h2>Authorities on-chain</h2>
          {AUTHORITIES.map((item) => (
            <article key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.role}</span>
              <code>{item.key}</code>
            </article>
          ))}
        </section>
        <section className="fw-chain">
          <h2>Hash-linked blocks</h2>
          <div className="chain">
            {chain.map((block) => (
              <article key={`${block.height}-${block.hash}`} className={block.type}>
                <em>
                  #{block.height} · {block.type}
                </em>
                <strong>{block.title}</strong>
                <p>{block.detail}</p>
                <code>hash {block.hash.slice(0, 18)}…</code>
                <code>prev {block.prev.slice(0, 18)}…</code>
              </article>
            ))}
          </div>
        </section>
      </div>

      <p className={`fw-verdict ${done ? (denied.notes ? "ok" : "hot") : ""}`}>
        {done
          ? `Finished. Chain still ${integrity.ok ? "valid" : "broken"} at height ${integrity.height}. Left: visual lock. Right: every overwrite lost the vote; sealed hashes unchanged.`
          : phase === "attack"
            ? `${current?.title || "Attacking"} — proposal gossiping across the consortium.`
            : "Launch to race the same dummy ransom with and without the hash network."}
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
                  {isLocked ? "dummy lock" : isDenied ? "network DENY" : authorityName(file.authority)}
                </small>
              </div>
            );
          })}
        </div>
        {showNote && (
          <aside className="fw-note">
            <strong>LOCK-NOTE · dummy</strong>
            <p>Visual lock only. No encryption. The network never accepted this writer.</p>
          </aside>
        )}
        {isProtected && Object.keys(denied).length > 0 && (
          <aside className="fw-shield">
            <strong>Consortium denied the writer</strong>
            <p>
              {current && current !== "note"
                ? `${SEALED_FILES.find((row) => row.id === current)?.name || ""} remains sealed by ${authorityOf(SEALED_FILES.find((row) => row.id === current)?.authority || "root").name}`
                : "Sealed hashes still match the merkle root on every peer."}
            </p>
          </aside>
        )}
        <div className="fw-bar">
          <span>⊞ alice-pc</span>
          <span className="pill">{isProtected ? "chain replica ON" : "chain replica OFF"}</span>
        </div>
      </div>
    </section>
  );
}

function uniqueVotes(seen, ballots, from, to) {
  const next = [...seen];
  for (const id of [from, to]) {
    if (!next.some((item) => item.peer === id)) {
      const vote = ballots.find((item) => item.peer === id);
      if (vote) next.push(vote);
    }
  }
  return next;
}
