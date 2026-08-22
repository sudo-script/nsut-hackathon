import { Donut, GroupedBars, HorzBars, PALETTE } from "../components/PitchCharts.jsx";
import { FUNDS, MARKET, PL, PRICING, SOURCES, TRACTION, UNIT, YEARS } from "../data/finance";

export function MarketSlide() {
  return (
    <section className="slide">
      <p className="kicker">Market · research 2026</p>
      <h2>We sell a layer on a $8B EDR+MDR stack, not another agent war.</h2>
      <div className="split charts">
        <HorzBars
          title="Where we sit (USD B, 2026 research)"
          rows={[
            { label: "EDR", value: MARKET.edr2026, color: PALETTE.ml, note: "$6.33B · 24% CAGR" },
            { label: "MDR", value: MARKET.mdr2026, color: "#5ce1e6", note: "$1.62B · ~27% CAGR" },
            { label: "TAM (EDR+MDR)", value: MARKET.edr2026 + MARKET.mdr2026, color: "#8aa0b5", note: "$7.95B" },
            { label: "SAM overlay", value: 1.2, color: PALETTE.ns, note: "$1.2B investigation layer" },
            { label: "India cyber", value: MARKET.indiaCyber2026, color: "#c77dff", note: "$6.6B Mordor" },
          ]}
        />
        <div className="tri tight">
          <article>
            <em>TAM</em>
            <h3>$8.0B</h3>
            <p>EDR + MDR in 2026. Buyers already pay for an agent and a queue. We do not replace CrowdStrike or Defender.</p>
          </article>
          <article>
            <em>SAM</em>
            <h3>$1.2B</h3>
            <p>
              ~15% of that stack is investigation / context — the overlay we price. India + GCC MSSP is the door
              (Gartner: India managed security +15.1% in 2026).
            </p>
          </article>
          <article className="ours">
            <em>SOM · Y3</em>
            <h3>$5.9M ARR</h3>
            <p>159k endpoints. ~0.5% of SAM. Bottoms-up: 102 logos + 12 MSSP books, not a top-down wish.</p>
          </article>
        </div>
      </div>
      <p className="fine">{SOURCES}</p>
    </section>
  );
}

export function PricingSlide() {
  return (
    <section className="slide">
      <p className="kicker">Offer · startup pricing</p>
      <h2>Priced under managed EDR, sold as minutes given back.</h2>
      <div className="table-wrap">
        <table className="cmp fin">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Price</th>
              <th>Buyer</th>
              <th>Worked example</th>
            </tr>
          </thead>
          <tbody>
            {PRICING.map((row) => (
              <tr key={row.sku}>
                <th>{row.sku}</th>
                <td>
                  {row.price} <small>{row.unit}</small>
                </td>
                <td>{row.who}</td>
                <td className="ours">{row.acv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tri tight">
        <article>
          <em>Why $3 not $8</em>
          <p>
            Mordor notes SME managed EDR from ~$5/ep/mo. An overlay that needs their existing agent cannot
            clear that sticker. We stay a line item, not a rip-and-replace.
          </p>
        </article>
        <article>
          <em>CFO math</em>
          <p>
            Human triage is $20–45 per alert (20–40 min at loaded rates). A 500-seat SOC at $18K ACV needs
            to avoid ~one loaded T1-month of waste to win. Our lab cut looks 64% — that is the demo, not the booking.
          </p>
        </article>
        <article className="ours">
          <em>Vs suite ACV</em>
          <p>
            Culta: endpoint suites often $25–40K ACV. We land at ~$18–22K blended because we are the layer
            on top, which is how a seed company gets a 60–120 day cycle instead of a platform bake-off.
          </p>
        </article>
      </div>
    </section>
  );
}

export function ModelSlide() {
  return (
    <section className="slide">
      <p className="kicker">Three-year model · USD millions · India-costed team</p>
      <h2>First EBITDA-positive in Y3 at $5.9M ARR.</h2>
      <div className="split charts">
        <GroupedBars
          title="ARR vs recognized revenue vs EBITDA"
          groups={YEARS}
          max={6.2}
          series={[
            { name: "ARR", color: PALETTE.ns, values: TRACTION.arr },
            { name: "Revenue", color: "#5ce1e6", values: TRACTION.revenue },
            { name: "EBITDA |abs|", color: PALETTE.ml, values: [0.56, 0.36, 0.44] },
          ]}
        />
        <div className="table-wrap">
          <table className="cmp fin">
            <thead>
              <tr>
                <th />
                {YEARS.map((year) => (
                  <th key={year}>{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PL.map((row) => (
                <tr key={row.k} className={row.k === "EBITDA" ? "sum" : ""}>
                  <th>{row.k}</th>
                  {row.y.map((cell, i) => (
                    <td key={YEARS[i]} className={row.k === "EBITDA" && i === 2 ? "ours" : ""}>
                      {typeof cell === "number" ? (cell < 0 ? `−$${Math.abs(cell).toFixed(2)}` : `$${cell.toFixed(2)}`) : cell}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th>Logos / endpoints (k)</th>
                <td>20 · 17</td>
                <td>51 · 63</td>
                <td className="ours">102 · 159</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="fine">
        EBITDA bars use absolute value so the chart stays readable; Y1–Y2 are losses (−$0.56M, −$0.36M), Y3 is
        +$0.44M. Blended FTE $55–70K (India-heavy) vs ~$178K loaded US analyst. Gross margin tracks Culta endpoint
        SaaS (~75%), not MDR labor (55–60%) — we sell software, not a 24×7 SOC.
      </p>
    </section>
  );
}

export function UnitSlide() {
  return (
    <section className="slide">
      <p className="kicker">Unit economics · seed-stage cyber SaaS</p>
      <h2>LTV/CAC 4.9×. Payback 20 months. CAC under the category median.</h2>
      <div className="metrics">
        <article>
          <em>Blended ACV</em>
          <strong>${UNIT.blendedAcv}K</strong>
          <p>Below $25–40K suite comps because we are an overlay.</p>
        </article>
        <article>
          <em>Gross margin</em>
          <strong>{Math.round(UNIT.gm * 100)}%</strong>
          <p>Software + cloud. Not an MDR body shop.</p>
        </article>
        <article>
          <em>Logo churn</em>
          <strong>{Math.round(UNIT.churn * 100)}%</strong>
          <p>Implies ~8-year life; LTV uses that, not a 15-year fantasy.</p>
        </article>
        <article>
          <em>LTV</em>
          <strong>${UNIT.ltv}K</strong>
          <p>ACV × GM × 1/churn = 22 × 0.75 × 8.3.</p>
        </article>
        <article>
          <em>CAC</em>
          <strong>${UNIT.cac}K</strong>
          <p>Culta median $35–55K. We assume India GTM + PLG lab.</p>
        </article>
        <article>
          <em>LTV/CAC · payback</em>
          <strong>
            {UNIT.ltvCac}× · {UNIT.paybackMonths} mo
          </strong>
          <p>Target band for seed cyber is &gt;3× and &lt;24 months.</p>
        </article>
      </div>
      <p className="fine">
        Payback = CAC ÷ (ACV × GM ÷ 12) = 28 ÷ (22 × 0.75 ÷ 12) ≈ 20 months. Customer ROI story: one avoided
        loaded T1 ($70–90K salary, ~$178K fully loaded in US comps) pays for several years of a 500-seat overlay.
      </p>
    </section>
  );
}

export function RaiseSlide() {
  return (
    <section className="slide">
      <p className="kicker">The raise</p>
      <h2>Seed $1.6M · 18 months to ~$0.6M ARR · Series A at $2M ARR.</h2>
      <div className="split charts">
        <Donut title="Use of funds" slices={FUNDS} />
        <div className="tri tight">
          <article className="ours">
            <em>Ask</em>
            <h3>${UNIT.seedAsk}M seed</h3>
            <p>
              8–10 FTE: world-model + firmware-ledger core, one design-partner SOC, one GCC MSSP wedge. Runway{" "}
              {UNIT.runwayMonths} months.
            </p>
          </article>
          <article>
            <em>Milestones</em>
            <p>
              M6: 3 paying design partners. M12: $0.3M ARR, SOC2 start. M18: $0.56M ARR, 20 logos, ready for A.
            </p>
          </article>
          <article>
            <em>Why this is fundable</em>
            <p>
              Layer, not platform war. India cost base. Measurable investigation minutes. Same story the lab
              already shows on PhotoViewer.crypt and the dummy ransom chain.
            </p>
          </article>
        </div>
      </div>
      <p className="fine">
        Model, not a promise. If CAC lands at the Culta median ($45K) payback slips to ~33 months — that is the
        risk we buy down with the workstation / ledger demos as the proof, not a bigger field sales team on day one.
      </p>
    </section>
  );
}
