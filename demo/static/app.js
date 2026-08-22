const $ = (id) => document.getElementById(id);

const state = {
  scenario: "full_chain",
  frames: [],
  index: -1,
  timer: null,
  running: false,
};

const POS = {
  attacker: { x: 90, y: 140 },
  workstation: { x: 430, y: 250 },
  fileserver: { x: 640, y: 180 },
  dc: { x: 640, y: 330 },
  vault: { x: 860, y: 250 },
};

document.querySelectorAll("#scenarios .card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll("#scenarios .card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    state.scenario = card.dataset.scenario;
  });
});

const bindRange = (id, out, fmt) => {
  const el = $(id);
  const render = () => {
    $(out).textContent = fmt(el.value);
  };
  el.addEventListener("input", render);
  render();
};
bindRange("stealth", "stealth-out", (v) => v);
bindRange("speed", "speed-out", (v) => `${(Number(v) / 10).toFixed(1)}×`);
bindRange("ml-th", "ml-out", (v) => (Number(v) / 100).toFixed(2));
bindRange("ns-th", "ns-out", (v) => (Number(v) / 100).toFixed(2));

$("btn-launch").addEventListener("click", launch);
$("btn-pause").addEventListener("click", togglePause);
$("btn-step").addEventListener("click", () => step(true));

async function launch() {
  stop();
  resetVisuals();
  $("btn-launch").disabled = true;
  $("now-title").textContent = "Training detectors / building dummy campaign…";
  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: state.scenario,
        stealth: Number($("stealth").value),
        noise: $("noise").checked,
        ml_threshold: Number($("ml-th").value) / 100,
        ns_threshold: Number($("ns-th").value) / 100,
      }),
    });
    const data = await res.json();
    state.frames = data.frames;
    state.summary = data.summary;
    state.meta = data.meta;
    state.index = -1;
    $("log").innerHTML = "";
    $("verdict").textContent = `${data.meta.specimen}: ${data.meta.blurb}`;
    $("btn-pause").disabled = false;
    $("btn-step").disabled = false;
    state.running = true;
    $("btn-pause").textContent = "Pause";
    tick();
  } catch (err) {
    $("now-title").textContent = "Lab failed to start";
    $("now-copy").textContent = String(err);
  } finally {
    $("btn-launch").disabled = false;
  }
}

function tick() {
  clearTimeout(state.timer);
  if (!state.running) return;
  if (state.index + 1 >= state.frames.length) {
    finish();
    return;
  }
  step(false);
  const delay = 2200 / (Number($("speed").value) / 10);
  state.timer = setTimeout(tick, delay);
}

function step(manual) {
  if (state.index + 1 >= state.frames.length) {
    finish();
    return;
  }
  state.index += 1;
  applyFrame(state.frames[state.index]);
  if (manual && state.index + 1 >= state.frames.length) finish();
}

function togglePause() {
  if (!state.frames.length) return;
  state.running = !state.running;
  $("btn-pause").textContent = state.running ? "Pause" : "Resume";
  if (state.running) tick();
  else clearTimeout(state.timer);
}

function stop() {
  state.running = false;
  clearTimeout(state.timer);
}

function finish() {
  stop();
  $("btn-pause").textContent = "Pause";
  const s = state.summary || {};
  const ml = s.ml_detect_at;
  const ns = s.ns_detect_at;
  let line = "Race over. ";
  if (s.ns_won_race) line += `World model alerted first (event ${ns}). XGBoost ${ml === null ? "never alerted" : "at event " + ml}.`;
  else if (s.ml_won_race) line += `XGBoost alerted first (event ${ml}). World model ${ns === null ? "never alerted" : "at event " + ns}.`;
  else if (s.tie) line += `Both alerted on event ${ml}.`;
  else line += "Neither detector crossed its threshold.";
  line += ` Unique investigations: ${s.investigations ?? 0}.`;
  $("verdict").textContent = line;
}

function resetVisuals() {
  document.querySelectorAll(".node").forEach((n) => {
    n.classList.remove("discovered", "probed", "compromised", "contained", "stolen");
  });
  $("flying").innerHTML = "";
  ["hosts_discovered", "services_fingerprinted", "ports_probed", "files_touched", "credentials_touched", "hosts_pivoted"].forEach((k) => {
    document.querySelector(`[data-k="${k}"]`).textContent = "0";
  });
  document.querySelector('[data-k="mb_exfiltrated"]').textContent = "0 MB";
  $("ml-bar").style.width = "0";
  $("ml-score").textContent = "0.00";
  $("ml-status").textContent = "quiet";
  $("ml-status").className = "status";
  $("ns-status").textContent = "quiet";
  $("ns-status").className = "status";
  $("ml-when").textContent = "No alert yet";
  $("ns-when").textContent = "No alert yet";
  $("beliefs").innerHTML = "";
  $("rules").innerHTML = "";
}

function applyFrame(frame) {
  $("stage-tag").textContent = frame.stage;
  $("now-title").textContent = frame.title;
  $("now-copy").textContent = frame.narrative;
  updateImpact(frame.impact);
  markNodes(frame);
  fly(frame);
  updateDetectors(frame);
  const li = document.createElement("li");
  li.textContent = `t=${frame.index} · ${frame.stage} · ${frame.title} · XGB ${frame.ml_risk.toFixed(2)}${frame.ml_alert ? " ALERT" : ""} · NS ${frame.ns_score.toFixed(2)}${frame.ns_alert ? " ALERT" : ""}`;
  $("log").prepend(li);
}

function updateImpact(impact) {
  for (const [key, value] of Object.entries(impact)) {
    const el = document.querySelector(`[data-k="${key}"]`);
    if (!el) continue;
    el.textContent = key === "mb_exfiltrated" ? `${value} MB` : String(value);
  }
}

function markNodes(frame) {
  const src = document.getElementById(`node-${frame.source}`);
  const dst = document.getElementById(`node-${frame.target}`);
  if (frame.visual === "probe" || frame.visual === "fingerprint") {
    dst?.classList.add("discovered");
  }
  if (frame.visual === "scan") {
    dst?.classList.add("probed");
  }
  if (frame.visual === "creds" || frame.visual === "pivot" || frame.visual === "exfil" || frame.visual === "steal") {
    src?.classList.add("compromised");
    dst?.classList.add("compromised");
  }
  if (frame.visual === "exfil" || frame.visual === "steal") {
    document.getElementById("node-vault")?.classList.add("stolen");
  }
  if (frame.ns_alert) {
    document.getElementById("node-workstation")?.classList.add("contained");
  }
}

function fly(frame) {
  const a = POS[frame.source];
  const b = POS[frame.target];
  if (!a || !b) return;
  const layer = $("flying");
  const color = {
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
  }[frame.visual] || "#3ee0a0";
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("r", frame.visual === "exfil" ? 7 : 5);
  dot.setAttribute("fill", color);
  layer.appendChild(dot);
  const start = performance.now();
  const dur = 700;
  const animate = (t) => {
    const p = Math.min(1, (t - start) / dur);
    const x = a.x + (b.x - a.x) * p;
    const y = a.y + (b.y - a.y) * p;
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    if (p < 1) requestAnimationFrame(animate);
    else setTimeout(() => dot.remove(), 200);
  };
  requestAnimationFrame(animate);

  if (frame.stolen_name) {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "file-chip");
    label.setAttribute("x", (a.x + b.x) / 2);
    label.setAttribute("y", (a.y + b.y) / 2 - 12);
    label.setAttribute("text-anchor", "middle");
    label.textContent = `STEAL ${frame.stolen_name}`;
    layer.appendChild(label);
    setTimeout(() => label.remove(), 1600);
  }
}

function updateDetectors(frame) {
  $("ml-bar").style.width = `${Math.min(100, frame.ml_risk * 100)}%`;
  $("ml-score").textContent = frame.ml_risk.toFixed(2);
  $("ml-status").textContent = frame.ml_alert ? "ALERT" : "quiet";
  $("ml-status").className = "status" + (frame.ml_alert ? " hot" : "");
  if (frame.ml_alert) $("ml-when").textContent = `Alerted at event ${frame.index}`;

  $("ns-status").textContent = frame.ns_alert ? "ALERT" : "quiet";
  $("ns-status").className = "status" + (frame.ns_alert ? " hot" : "");
  if (frame.ns_alert) $("ns-when").textContent = `Alerted at event ${frame.index}`;
  $("ns-action").textContent = `action: ${frame.action}`;

  const order = [
    "normal",
    "suspicious_execution",
    "persistence",
    "credential_access",
    "lateral_movement",
    "command_and_control",
    "compromised",
  ];
  $("beliefs").innerHTML = order
    .map((key) => {
      const v = frame.belief[key] || 0;
      return `<div class="belief-row"><span>${key.replaceAll("_", " ")}</span><b><i style="width:${(v * 100).toFixed(0)}%"></i></b></div>`;
    })
    .join("");
  $("rules").innerHTML = (frame.rules || []).map((r) => `<li>${r}</li>`).join("");
}
