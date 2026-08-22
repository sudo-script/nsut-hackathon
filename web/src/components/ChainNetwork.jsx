import { LINKS, PEERS } from "../lib/chain";

const POS = Object.fromEntries(PEERS.map((peer) => [peer.id, peer]));

export default function ChainNetwork({ votes, packets, integrity, tip }) {
  const voteOf = (id) => votes.find((item) => item.peer === id);
  return (
    <section className="fw-net">
      <h2>Hash-protection network</h2>
      <svg viewBox="0 0 840 300" role="img" aria-label="Consortium blockchain network">
        {LINKS.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={POS[a].x}
            y1={POS[a].y}
            x2={POS[b].x}
            y2={POS[b].y}
            className="net-link"
          />
        ))}
        {packets.map((packet) => {
          const from = POS[packet.from];
          const to = POS[packet.to];
          const x = from.x + (to.x - from.x) * packet.t;
          const y = from.y + (to.y - from.y) * packet.t;
          return <circle key={packet.id} cx={x} cy={y} r="5" className="net-pkt" />;
        })}
        {PEERS.map((peer) => {
          const vote = voteOf(peer.id);
          return (
            <g key={peer.id} transform={`translate(${peer.x},${peer.y})`}>
              <circle r="28" className={`net-node ${peer.role} ${vote ? vote.vote.toLowerCase() : ""}`} />
              <text y="4">{short(peer)}</text>
              <text className="net-label" y="44">
                {peer.name}
              </text>
              {vote && (
                <text className={`net-vote ${vote.vote.toLowerCase()}`} y="-36">
                  {vote.vote}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className={`net-status ${integrity.ok ? "ok" : "hot"}`}>
        {integrity.ok
          ? `Chain valid · height ${integrity.height} · tip ${tip.slice(0, 16)}… · merkle ${integrity.merkle?.slice(0, 12) || "—"}…`
          : `Chain broken · ${integrity.reason}`}
      </p>
    </section>
  );
}

function short(peer) {
  if (peer.role === "endpoint") return "PC";
  if (peer.role === "authority") return "CA";
  return "VAL";
}
