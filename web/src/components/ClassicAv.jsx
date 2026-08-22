const AV_STEPS = [
  { id: "scan-sig", label: "Scan-time: signature database" },
  { id: "scan-hash", label: "Scan-time: file hash / reputation" },
  { id: "run-hook", label: "Run-time: process / API hooks" },
];

export function classicAvResult(file) {
  if (file.promote === "allow") {
    return {
      scan: "CLEAN",
      runtime: "CLEAN",
      bypassed: false,
      detail: "Known signed publisher. Signature and hash match the AV set.",
    };
  }
  if (file.obfuscated) {
    return {
      scan: "CLEAN",
      runtime: "CLEAN",
      bypassed: true,
      detail: "Packed / obfuscated stub. No known signature. Strings and hash are hidden from scan-time and simple run-time hooks.",
    };
  }
  return {
    scan: "THREAT",
    runtime: "THREAT",
    bypassed: false,
    detail: "Plain dummy sample. Generic family signature matched at scan-time.",
  };
}

export function ClassicAvWindow({ file, step, visible }) {
  if (!visible || !file) return null;
  const result = classicAvResult(file);
  const done = step >= AV_STEPS.length;
  return (
    <div className="av-window">
      <div className="av-bar">
        <span>ShieldOne Antivirus — scan-time + run-time only</span>
      </div>
      <div className="av-body">
        <p className="av-file">{file.name}</p>
        <ul>
          {AV_STEPS.map((item, index) => (
            <li key={item.id} className={index < step ? "done" : index === step ? "now" : ""}>
              {item.label}
            </li>
          ))}
        </ul>
        {done && (
          <div className={`av-result ${result.bypassed ? "miss" : result.scan === "THREAT" ? "hit" : "ok"}`}>
            <strong>Scan-time: {result.scan}</strong>
            <strong>Run-time: {result.runtime}</strong>
            <p>{result.detail}</p>
            {result.bypassed && <p className="av-bypass">BYPASSED — crypter / obfuscation hides the on-disk sample from this AV.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function AvTray({ file, phase }) {
  if (!file) return <span className="pill dim">ShieldOne AV</span>;
  const result = classicAvResult(file);
  const ready = phase !== "av";
  const label = !ready ? "AV scanning…" : result.bypassed ? "AV CLEAN (bypass)" : result.scan === "THREAT" ? "AV THREAT" : "AV CLEAN";
  return <span className={`pill ${ready && result.bypassed ? "warn" : ready && result.scan === "THREAT" ? "hot" : ""}`}>{label}</span>;
}

export { AV_STEPS };
