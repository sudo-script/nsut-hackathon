import { useEffect, useRef, useState } from "react";

export function HostAppWindow({ file, frame = null, quarantined = false, onClose, offset = 0 }) {
  return (
    <div
      className={`host-app ${file.app} ${quarantined ? "flagged" : ""}`}
      style={{ top: 28 + offset * 22, left: 200 + offset * 18 }}
    >
      <div className="host-app-bar">
        <span>{file.windowTitle || file.name}</span>
        <button type="button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="host-app-body">
        {file.app === "paint" && <PaintApp />}
        {file.app === "notepad" && <NotepadApp />}
        {file.app === "calc" && <CalcApp />}
        {file.app === "notes" && <NotesApp />}
        {file.app === "health" && <HealthApp />}
        {file.app === "photoviewer" && <PackedPhotoViewer frame={frame} quarantined={quarantined} />}
      </div>
    </div>
  );
}

const ALBUM = [
  { id: "beach", title: "Vacation-2024.jpg", caption: "Harbor — Aug 2024" },
  { id: "trail", title: "dusk-trail.jpg", caption: "Ridge trail at dusk" },
  { id: "city", title: "night-market.jpg", caption: "City lights" },
  { id: "cabin", title: "cabin.jpg", caption: "Weekend cabin" },
];

export function PackedPhotoViewer({ frame, quarantined = false }) {
  const [idx, setIdx] = useState(0);
  const photo = ALBUM[idx];
  const stolen = frame?.stolen_name;
  const hostile = Boolean(frame && ["exfil", "steal", "beacon", "creds", "spawn"].includes(frame.visual));

  return (
    <div className={`photos-app ${hostile ? "hostile" : ""} ${quarantined ? "locked" : ""}`}>
      <div className="photos-toolbar">
        <button type="button" onClick={() => setIdx((n) => (n + ALBUM.length - 1) % ALBUM.length)} aria-label="Previous">
          ‹
        </button>
        <span>{photo.title}</span>
        <button type="button" onClick={() => setIdx((n) => (n + 1) % ALBUM.length)} aria-label="Next">
          ›
        </button>
      </div>
      <div className={`photos-stage art-${photo.id}`}>
        <div className="photos-sun" />
        <div className="photos-ground" />
        <p>{photo.caption}</p>
      </div>
      <div className="photos-thumbs">
        {ALBUM.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`art-${item.id} ${index === idx ? "on" : ""}`}
            onClick={() => setIdx(index)}
            aria-label={item.title}
          />
        ))}
      </div>
      {hostile && <p className="photos-note">{frame?.title || "Unpacking stub"}</p>}
      {stolen && <p className="steal">Copying {stolen} to rare host…</p>}
      {quarantined && (
        <p className="photos-banner">World model blocked host persist. This Photos window is a sandbox copy only.</p>
      )}
    </div>
  );
}

function PaintApp() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [color, setColor] = useState("#111111");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function pos(event) {
    const box = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function start(event) {
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(event) {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(event);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  return (
    <div className="paint">
      <div className="paint-tools">
        {["#111111", "#d13438", "#0078d4", "#107c10", "#ff8c00", "#8764b8"].map((swatch) => (
          <button
            key={swatch}
            className={color === swatch ? "on" : ""}
            style={{ background: swatch }}
            onClick={() => setColor(swatch)}
            aria-label={swatch}
          />
        ))}
        <em>Paint — cleared and running on the host</em>
      </div>
      <canvas
        ref={canvasRef}
        width={420}
        height={240}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
      />
    </div>
  );
}

function NotepadApp() {
  const [text, setText] = useState("Meeting notes\n- sandbox passed\n- signed Microsoft build\n- allowed on alice-pc\n");
  return (
    <textarea className="notepad" value={text} onChange={(event) => setText(event.target.value)} />
  );
}

function CalcApp() {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);

  function digit(n) {
    setDisplay((cur) => (cur === "0" ? String(n) : cur + n));
  }
  function apply(next) {
    const value = Number(display);
    if (acc == null || op == null) {
      setAcc(value);
    } else {
      const result = op === "+" ? acc + value : op === "-" ? acc - value : op === "×" ? acc * value : acc / value;
      setAcc(result);
      setDisplay(String(result));
    }
    setOp(next);
    if (next) setDisplay("0");
  }
  function equals() {
    apply(null);
    setOp(null);
  }

  return (
    <div className="calc">
      <div className="calc-screen">{display}</div>
      <div className="calc-keys">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((n) => (
          <button key={n} onClick={() => digit(n)}>
            {n}
          </button>
        ))}
        {["+", "-", "×", "÷"].map((symbol) => (
          <button key={symbol} className="op" onClick={() => apply(symbol)}>
            {symbol}
          </button>
        ))}
        <button className="eq" onClick={equals}>
          =
        </button>
        <button onClick={() => { setDisplay("0"); setAcc(null); setOp(null); }}>C</button>
      </div>
    </div>
  );
}

function NotesApp() {
  return (
    <article className="doc">
      <h4>Project notes</h4>
      <p>Signed user document. Sandbox found no script spawn, no rare outbound, no credential tools.</p>
      <p>Promoted to the host after firmware measurement matched the allow-list.</p>
    </article>
  );
}

function HealthApp() {
  return (
    <article className="doc">
      <h4>weekly_health.ps1 — completed</h4>
      <ul>
        <li>Disk 42% used</li>
        <li>Last backup: 06:00 (backup.svc)</li>
        <li>WSUS check: update.corp.local OK</li>
      </ul>
      <p>Admin script used an explicit file path. World model kept belief in Normal.</p>
    </article>
  );
}
