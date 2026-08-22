import catalog from "../data/campaigns.json";

export const SCENARIOS = [
  { id: "full_chain", specimen: "DUMMY-HYDRA", label: "Full chain" },
  { id: "recon_footprint", specimen: "DUMMY-RECON", label: "Recon + footprint" },
  { id: "pentest_lateral", specimen: "DUMMY-LATERAL", label: "Pentest + pivot" },
  { id: "data_theft", specimen: "DUMMY-MOTH", label: "Data theft" },
  { id: "benign_admin", specimen: "DUMMY-BENIGN", label: "Admin / backup" },
];

export const STEALTH_STEPS = [0, 20, 35, 50, 70, 90];

export function nearestStealth(value) {
  return STEALTH_STEPS.reduce((best, step) =>
    Math.abs(step - value) < Math.abs(best - value) ? step : best
  );
}

export function loadCampaign(scenario, stealth, noise) {
  const snapped = nearestStealth(stealth);
  const key = `${scenario}|${snapped}|${noise ? 1 : 0}`;
  const found = catalog.campaigns.find((item) => item.key === key);
  return found || catalog.campaigns[0];
}

export function nsScore(belief) {
  return Math.max(
    belief.suspicious_execution || 0,
    belief.persistence || 0,
    belief.credential_access || 0,
    belief.lateral_movement || 0,
    belief.command_and_control || 0,
    belief.compromised || 0
  );
}

export function applyThresholds(campaign, mlThreshold, nsThreshold) {
  let mlDetectAt = null;
  let nsDetectAt = null;
  const frames = campaign.frames.map((frame) => {
    const mlAlert = frame.ml_risk >= mlThreshold;
    const nsAlert = nsScore(frame.belief) >= nsThreshold || (frame.belief.compromised || 0) >= 0.2;
    if (mlAlert && mlDetectAt === null) mlDetectAt = frame.index;
    if (nsAlert && nsDetectAt === null) nsDetectAt = frame.index;
    return { ...frame, ml_alert: mlAlert, ns_alert: nsAlert, ns_score: nsScore(frame.belief) };
  });
  return {
    ...campaign,
    frames,
    race: {
      mlDetectAt,
      nsDetectAt,
      mlWon: mlDetectAt !== null && (nsDetectAt === null || mlDetectAt < nsDetectAt),
      nsWon: nsDetectAt !== null && (mlDetectAt === null || nsDetectAt < mlDetectAt),
      tie: mlDetectAt !== null && mlDetectAt === nsDetectAt,
      investigations: campaign.summary.investigations,
    },
  };
}

export function raceText(race) {
  if (!race) return "Launch to race the two detectors.";
  const { mlDetectAt: ml, nsDetectAt: ns } = race;
  let line = "Race over. ";
  if (race.nsWon) {
    line += `World model alerted first (event ${ns}). XGBoost ${ml === null ? "never alerted" : "at event " + ml}.`;
  } else if (race.mlWon) {
    line += `XGBoost alerted first (event ${ml}). World model ${ns === null ? "never alerted" : "at event " + ns}.`;
  } else if (race.tie) {
    line += `Both alerted on event ${ml}.`;
  } else {
    line += "Neither detector crossed its threshold.";
  }
  return `${line} Unique investigations: ${race.investigations ?? 0}.`;
}
