/**
 * Startup financial model (USD). Research-backed assumptions, not a forecast guarantee.
 *
 * Market: Mordor Intelligence EDR 2026 $6.33B, 24.16% CAGR to $18.68B (2031);
 * Windsor Drake / Mordor MDR ~$1.62B, ~27% CAGR; India cyber ~$6.6B (Mordor 2026)
 * or $3.4B info-sec spend (Gartner 2026). India MSS fastest subsegment (Gartner +15.1% 2026).
 *
 * Pricing: managed EDR bundles from ~$5/endpoint/month (Mordor SME); overlay priced under
 * that floor. Cyber SaaS endpoint ACV often $25–40K (Culta 2026) — we sell a layer, not the suite.
 *
 * Unit econ: cyber SaaS GM 72–78% (endpoint ~75%); median CAC $35–55K; sales cycle 60–120 days
 * (Culta). Human triage $20–45/alert; loaded analyst ~$178K (D3 from BLS). T1 $70–90K (2026 guides).
 */

export const MARKET = {
  edr2026: 6.33,
  edr2031: 18.68,
  edrCagr: 24.16,
  mdr2026: 1.62,
  indiaCyber2026: 6.56,
  indiaInfoSecGartner: 3.4,
  globalCyber2026: 240,
};

export const PRICING = [
  { sku: "Overlay Core", price: "$3.00", unit: "/endpoint/mo", who: "50–2,000 seat SOC", acv: "500 seats → $18K ACV" },
  { sku: "MSSP wholesale", price: "$1.50", unit: "/endpoint/mo", who: "Multi-tenant partners", acv: "8k seats → $144K partner" },
  { sku: "Ledger add-on", price: "$0.75", unit: "/endpoint/mo", who: "Ransom / file-seal", acv: "on top of Core" },
];

export const YEARS = ["Y1", "Y2", "Y3"];

export const TRACTION = {
  logos: [20, 51, 102],
  endpoints: [17, 63, 159],
  arr: [0.56, 2.19, 5.91],
  revenue: [0.32, 1.55, 4.4],
};

export const PL = [
  { k: "ARR (exit)", y: [0.56, 2.19, 5.91] },
  { k: "Recognized revenue", y: [0.32, 1.55, 4.4] },
  { k: "COGS", y: [0.07, 0.37, 1.1] },
  { k: "Gross profit", y: [0.25, 1.18, 3.3] },
  { k: "Gross margin", y: ["78%", "76%", "75%"], raw: false },
  { k: "R&D", y: [0.38, 0.72, 1.2] },
  { k: "S&M", y: [0.22, 0.52, 1.1] },
  { k: "G&A", y: [0.21, 0.3, 0.56] },
  { k: "EBITDA", y: [-0.56, -0.36, 0.44] },
];

export const UNIT = {
  blendedAcv: 22,
  gm: 0.75,
  churn: 0.12,
  cac: 28,
  paybackMonths: 20,
  ltv: 137.5,
  ltvCac: 4.9,
  seedAsk: 1.6,
  runwayMonths: 18,
};

export const FUNDS = [
  { label: "Product / research", value: 45, color: "#3ee0a0" },
  { label: "GTM (India + GCC MSSP)", value: 30, color: "#5ce1e6" },
  { label: "Cloud / compliance", value: 15, color: "#e9b14a" },
  { label: "Reserve", value: 10, color: "#8aa0b5" },
];

export const SOURCES =
  "Mordor EDR 2026 $6.33B / 24% CAGR; MDR ~$1.62B. India cyber ~$6.6B (Mordor) · Gartner India info-sec $3.4B / MSS +15.1% (2026). Culta cyber SaaS GM 75%, CAC $35–55K, endpoint suite ACV $25–40K. D3/BLS loaded analyst ~$178K, $20–45 per human alert. Managed EDR from ~$5/ep/mo (Mordor SME). Model uses India-blended FTE cost. Simulator −64% looks is lab evidence, not a booked saving.";
