/** Simulated API / assembly behavior — not a real disassembler or unpacker. */

const TAPE = {
  drop: ["call kernel32.CreateFileW", "mov rcx, invoice.docm"],
  spawn: ["call kernel32.CreateProcessW", "lea rdx, [powershell.exe]"],
  probe: ["call ws2_32.connect", "mov edx, 445  ; lab SMB probe"],
  fingerprint: ["call advapi32.RegQueryValueExW", "lea rcx, [CurrentVersion]"],
  scan: ["call ws2_32.connect", "mov edx, 3389  ; simulated port pulse"],
  creds: ["call kernel32.OpenProcess", "lea rcx, [lsass]  ; indicator only"],
  steal: ["call kernel32.CreateFileW", "lea rcx, [vault\\export.csv]"],
  exfil: ["call winhttp.WinHttpSendRequest", "; rare dest in sandbox only"],
  beacon: ["call winhttp.WinHttpSendRequest", "loop  ; repeated rare host"],
  pivot: ["call advapi32.CreateProcessAsUserW", "; dummy lateral name"],
  auth: ["call secur32.LsaLogonUser", "mov r8, fileserver-01"],
  benign: ["call kernel32.CreateProcessW", "lea rdx, [-File weekly_health.ps1]"],
};

const SAFE_TAPE = [
  ["xor eax, eax", "call user32.GetMessageW"],
  ["call gdi32.BitBlt", "; paint / ui only"],
  ["ret", "no CreateProcess child · no WinHttp"],
];

export function AssemblyTape({ file, frame, phase }) {
  const lines = frame
    ? TAPE[frame.visual] || TAPE.spawn
    : file?.promote === "allow"
      ? SAFE_TAPE.flat()
      : ["waiting for sandbox execution…"];

  return (
    <section className={`sec-card ${frame || (file && phase !== "idle") ? "live" : ""}`}>
      <h3>Firmware + assembly behavior</h3>
      <p className="asm-note">
        Not a signature. The sandbox emits API / control-flow telemetry after the UEFI gate. Packing changes bytes on
        disk; it does not hide CreateProcess → rare host once the sample runs.
      </p>
      <pre className="asm">
        {lines.map((line, index) => (
          <div key={`${line}-${index}`}>{line}</div>
        ))}
      </pre>
      {file?.obfuscated && (
        <p className="asm-flag">On-disk bytes are obfuscated. In-sandbox behavior still matches the attack graph.</p>
      )}
    </section>
  );
}
