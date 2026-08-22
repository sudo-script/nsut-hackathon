/** Simulated firmware file-seal authorities. Hashes are lab placeholders; the chain module commits them. */

export const AUTHORITIES = [
  {
    id: "root",
    name: "UEFI Root of Trust",
    role: "Firmware",
    key: "ed25519:UEFI-ROOT-LAB",
    hash: "001a8c2e91f04b77d3e6a10c8b55f29e4a17c80d2b93e61f0c44a8d15e70b312",
  },
  {
    id: "msft",
    name: "Microsoft Windows (lab)",
    role: "OS vendor",
    key: "ed25519:MSFT-LAB",
    hash: "7d2a91c0e84b15f3a6c80d2e94b71a0c3f58e19d24b7c6a0e91f33d5a18b901",
    parent: "root",
  },
  {
    id: "it",
    name: "Contoso IT",
    role: "Admin authority",
    key: "ed25519:IT-LAB",
    hash: "11b0e8c47a92d3f15c6a80b2e94d71c0a3f58e19d24b7c6a0e91f33d5a18b247",
    parent: "root",
  },
  {
    id: "alice",
    name: "Alice / Contoso",
    role: "User authority",
    key: "ed25519:ALICE-LAB",
    hash: "55c2a91e0d84b17f3c6e20a8d91f44b7e0c18a3d5b26f90c7a14e82d3b09c156",
    parent: "it",
  },
];

export const SEALED_FILES = [
  {
    id: "notes",
    name: "notes.docx",
    icon: "W",
    color: "#2b579a",
    authority: "alice",
    hash: "55c2a91e0d84b17f3c6e20a8d91f44b7e0c18a3d5b26f90c7a14e82d3b09c156",
    kind: "User document",
  },
  {
    id: "vault",
    name: "q3-vault.xlsx",
    icon: "X",
    color: "#217346",
    authority: "alice",
    hash: "9c10e2aa71b4d8f03c55e19a80d2b77e4f1c6a90b3d8e21c7a44f0b19d63c815",
    kind: "Finance share",
  },
  {
    id: "photos",
    name: "Vacation-2024.jpg",
    icon: "📷",
    color: "#3d3d3d",
    authority: "alice",
    hash: "ee91c0b7a24d5f18c3e6a1b8d02f94c7a55e10d3b8c47f2a91e06c33d4b18c01",
    kind: "User photo",
  },
  {
    id: "paint",
    name: "Paint.exe",
    icon: "P",
    color: "#f3c14a",
    authority: "msft",
    hash: "7d2a91c0e84b15f3a6c80d2e94b71a0c3f58e19d24b7c6a0e91f33d5a18b901",
    kind: "System binary",
  },
  {
    id: "health",
    name: "weekly_health.ps1",
    icon: "PS",
    color: "#012456",
    authority: "it",
    hash: "11b0e8c47a92d3f15c6a80b2e94d71c0a3f58e19d24b7c6a0e91f33d5a18b247",
    kind: "Admin script",
  },
  {
    id: "ids",
    name: "hr-ids.csv",
    icon: "ID",
    color: "#8b2e2e",
    authority: "it",
    hash: "c8a1d04e7b33f19a6e55c2d80b14e9a7f3c10d2b8a64e51c90d37b2e4f18c063",
    kind: "HR export",
  },
];

export const RANSOM_STEPS = [
  {
    id: "drop",
    title: "Dummy dropper lands",
    detail: "LOCK-NOTE.dummy is not signed by any enrolled authority. Lab-only specimen.",
    file: null,
  },
  ...SEALED_FILES.map((file) => ({
    id: `write-${file.id}`,
    title: `Overwrite ${file.name}`,
    detail: "Dummy ransom tries to replace the sealed bytes. No authority signature is presented.",
    file: file.id,
  })),
  {
    id: "note",
    title: "Drop ransom note",
    detail: "Attempt to create README_LOCK.txt on the desktop. Still a simulated write.",
    file: "note",
  },
];

export const DUMMY_NOTE = {
  id: "note",
  name: "README_LOCK.txt",
  icon: "!",
  color: "#d13438",
};

export function authorityName(id) {
  return AUTHORITIES.find((item) => item.id === id)?.name || id;
}

export function authorityOf(id) {
  return AUTHORITIES.find((item) => item.id === id) || AUTHORITIES[0];
}
