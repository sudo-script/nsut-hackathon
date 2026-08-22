/**
 * Permissioned lab blockchain for file-seal hashes.
 * Content-addressed blocks + majority vote. Not a cryptocurrency, not mining.
 */

import { AUTHORITIES, SEALED_FILES, authorityName } from "../data/ledger";

export function labHash(input) {
  const text = typeof input === "string" ? input : JSON.stringify(input);
  let seed = 2166136261;
  const parts = [];
  for (let round = 0; round < 8; round += 1) {
    let h = seed ^ (round + 1) * 2654435761;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    parts.push((h >>> 0).toString(16).padStart(8, "0"));
    seed = h >>> 0;
  }
  return parts.join("");
}

export function blockBody(block) {
  return {
    height: block.height,
    type: block.type,
    title: block.title,
    detail: block.detail,
    authority: block.authority || null,
    fileId: block.fileId || null,
    fileHash: block.fileHash || null,
    prev: block.prev,
  };
}

export function hashBlock(block) {
  return labHash(blockBody(block));
}

export function merkleSeals(chain) {
  const seals = chain.filter((block) => block.fileHash).map((block) => `${block.fileId}:${block.fileHash}`);
  return labHash(seals.join("|") || "empty-seal-set");
}

export function finishBlock(draft) {
  return { ...draft, hash: hashBlock(draft), merkle: merkleSeals([draft]) };
}

export function appendBlock(chain, fields) {
  const prev = chain[chain.length - 1];
  const draft = {
    height: prev.height + 1,
    prev: prev.hash,
    type: fields.type,
    title: fields.title,
    detail: fields.detail,
    authority: fields.authority || null,
    fileId: fields.fileId || null,
    fileHash: fields.fileHash || null,
  };
  const next = { ...draft, hash: hashBlock(draft) };
  return [...chain, { ...next, merkle: merkleSeals([...chain, next]) }];
}

export function verifyChain(chain) {
  if (!chain.length) return { ok: false, reason: "empty chain", height: -1, tip: "" };
  if (chain[0].hash !== hashBlock(chain[0])) {
    return { ok: false, reason: "genesis hash invalid", height: 0, tip: chain[0].hash };
  }
  for (let i = 1; i < chain.length; i += 1) {
    if (chain[i].prev !== chain[i - 1].hash) {
      return { ok: false, reason: `broken link at #${i}`, height: i, tip: chain[i].hash };
    }
    if (chain[i].hash !== hashBlock(chain[i])) {
      return { ok: false, reason: `block hash mismatch at #${i}`, height: i, tip: chain[i].hash };
    }
  }
  const tip = chain[chain.length - 1];
  return { ok: true, reason: "all prev-hash links hold", height: tip.height, tip: tip.hash, merkle: tip.merkle };
}

export function sealedHashOnChain(chain, fileId) {
  const seals = chain.filter((block) => block.type === "seal" && block.fileId === fileId);
  return seals.length ? seals[seals.length - 1].fileHash : null;
}

export function authorizeWrite(chain, { fileId, fileHash, writer, signedBy }) {
  const golden = sealedHashOnChain(chain, fileId);
  const authority = AUTHORITIES.find((item) => item.id === signedBy);
  if (!golden) {
    return { allow: false, reason: "object is not sealed on the network" };
  }
  if (golden !== fileHash) {
    return { allow: false, reason: "local bytes drifted from the network merkle seal" };
  }
  if (!authority) {
    return { allow: false, reason: `${writer} has no enrolled authority key` };
  }
  return { allow: true, reason: `${authority.name} may rewrite this seal` };
}

export const PEERS = [
  { id: "alice-pc", name: "alice-pc UEFI", role: "endpoint", x: 110, y: 150 },
  { id: "it-ca", name: "Contoso IT CA", role: "authority", x: 300, y: 58 },
  { id: "msft-ca", name: "Microsoft CA", role: "authority", x: 300, y: 242 },
  { id: "mssp-a", name: "MSSP validator A", role: "validator", x: 520, y: 58 },
  { id: "mssp-b", name: "MSSP validator B", role: "validator", x: 520, y: 242 },
  { id: "campus", name: "Campus anchor", role: "validator", x: 720, y: 150 },
];

export const LINKS = [
  ["alice-pc", "it-ca"],
  ["alice-pc", "msft-ca"],
  ["it-ca", "mssp-a"],
  ["msft-ca", "mssp-b"],
  ["it-ca", "msft-ca"],
  ["mssp-a", "mssp-b"],
  ["mssp-a", "campus"],
  ["mssp-b", "campus"],
];

export function voteOnProposal(proposal) {
  return PEERS.map((peer) => {
    const deny = !proposal.signedBy;
    return {
      peer: peer.id,
      name: peer.name,
      vote: deny ? "DENY" : "ALLOW",
      reason: deny ? "writer key missing on consortium" : "authority signature verified",
    };
  });
}

export function quorumOf(votes) {
  const deny = votes.filter((item) => item.vote === "DENY").length;
  const need = Math.ceil((votes.length * 2) / 3);
  return { deny, total: votes.length, need, commit: deny >= need };
}

export function buildGenesis() {
  const zero = "0".repeat(64);
  const genesisDraft = {
    height: 0,
    prev: zero,
    type: "genesis",
    title: "UEFI genesis",
    detail: "Root of trust. Empty file-seal set.",
    authority: "root",
    fileId: null,
    fileHash: null,
  };
  let chain = [finishBlock(genesisDraft)];
  chain[0] = { ...chain[0], merkle: merkleSeals(chain) };

  const enrolls = AUTHORITIES.filter((item) => item.id !== "root").map((item) => ({
    type: "enroll",
    title: `Enroll ${item.name}`,
    detail: `${item.role} key ${item.key} anchored by parent ${item.parent || "root"}.`,
    authority: item.id,
  }));

  for (const fields of enrolls) {
    chain = appendBlock(chain, fields);
  }

  for (const file of SEALED_FILES) {
    chain = appendBlock(chain, {
      type: "seal",
      title: `Seal ${file.name}`,
      detail: `Golden hash committed. Only ${authorityName(file.authority)} may rewrite.`,
      authority: file.authority,
      fileId: file.id,
      fileHash: file.hash,
    });
  }
  return chain;
}
