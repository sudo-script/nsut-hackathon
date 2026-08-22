const PALETTE = {
  av: "#8aa0b5",
  ml: "#e9b14a",
  ns: "#3ee0a0",
  hot: "#ff5d6c",
  mute: "#8eae9a",
};

export function GroupedBars({ title, groups, series, max, unit = "", height = 168 }) {
  const width = 420;
  const pad = { l: 28, r: 8, t: 10, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const gW = innerW / groups.length;
  const barW = Math.min(16, (gW - 12) / series.length);

  return (
    <figure className="chart">
      {title && <figcaption>{title}</figcaption>}
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title || "bar chart"}>
        {[0.25, 0.5, 0.75, 1].map((tick) => {
          const y = pad.t + innerH * (1 - tick);
          return (
            <g key={tick}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} className="grid" />
              <text x={pad.l - 4} y={y + 3} className="axis" textAnchor="end">
                {formatTick(max * tick, unit)}
              </text>
            </g>
          );
        })}
        {groups.map((label, gi) => {
          const x0 = pad.l + gi * gW + (gW - series.length * barW - (series.length - 1) * 4) / 2;
          return (
            <g key={label}>
              {series.map((row, si) => {
                const value = row.values[gi];
                const h = (value / max) * innerH;
                const x = x0 + si * (barW + 4);
                const y = pad.t + innerH - h;
                return (
                  <g key={row.name}>
                    <rect x={x} y={y} width={barW} height={Math.max(h, 1)} fill={row.color} rx="2" />
                  </g>
                );
              })}
              <text x={pad.l + gi * gW + gW / 2} y={height - 6} className="axis" textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <Legend items={series.map((row) => ({ label: row.name, color: row.color }))} />
    </figure>
  );
}

export function HorzBars({ title, rows }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <figure className="chart">
      {title && <figcaption>{title}</figcaption>}
      <div className="hbar">
        {rows.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <b>
              <i style={{ width: `${(row.value / max) * 100}%`, background: row.color }} />
            </b>
            <em>{row.note || row.value}</em>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function Donut({ title, slices, size = 168 }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const r = 58;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <figure className="chart donut">
      {title && <figcaption>{title}</figcaption>}
      <svg viewBox="0 0 180 180" width={size} height={size} role="img" aria-label={title || "donut"}>
        <circle cx="90" cy="90" r={r} className="donut-track" />
        {slices.map((slice) => {
          const len = (slice.value / total) * c;
          const dash = `${len} ${c - len}`;
          const node = (
            <circle
              key={slice.label}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
            />
          );
          offset += len;
          return node;
        })}
        <text x="90" y="86" textAnchor="middle" className="donut-n">
          {total}
        </text>
        <text x="90" y="104" textAnchor="middle" className="donut-u">
          mix %
        </text>
      </svg>
      <Legend items={slices.map((slice) => ({ label: `${slice.label} ${slice.value}%`, color: slice.color }))} />
    </figure>
  );
}

export function Radar({ title, axes, series, size = 260 }) {
  const cx = 140;
  const cy = 140;
  const maxR = 92;
  const n = axes.length;
  const rings = [0.25, 0.5, 0.75, 1];
  const point = (index, ratio) => {
    const angle = (index / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + maxR * ratio * Math.cos(angle), cy + maxR * ratio * Math.sin(angle)];
  };
  const poly = (values) => values.map((value, i) => point(i, value / 10).join(",")).join(" ");

  return (
    <figure className="chart radar">
      {title && <figcaption>{title}</figcaption>}
      <svg viewBox="0 0 280 280" width={size} height={size} role="img" aria-label={title || "radar"}>
        {rings.map((ring) => (
          <polygon
            key={ring}
            className="grid"
            points={Array.from({ length: n }, (_, i) => point(i, ring).join(",")).join(" ")}
          />
        ))}
        {axes.map((label, i) => {
          const [x2, y2] = point(i, 1);
          const [tx, ty] = point(i, 1.22);
          return (
            <g key={label}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} className="grid" />
              <text x={tx} y={ty} className="axis" textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
        {series.map((row) => (
          <polygon key={row.name} points={poly(row.values)} fill={row.color} fillOpacity="0.18" stroke={row.color} strokeWidth="2" />
        ))}
      </svg>
      <Legend items={series.map((row) => ({ label: row.name, color: row.color }))} />
    </figure>
  );
}

export function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map((item) => (
        <li key={item.label}>
          <i style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export { PALETTE };

function formatTick(value, unit) {
  if (unit === "%") return `${Math.round(value < 1 ? value * 100 : value)}%`;
  if (value >= 10) return String(Math.round(value));
  return value.toFixed(1);
}
