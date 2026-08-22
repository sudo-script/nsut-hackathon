# Simulation Lab (React)

Static Vite + React app with two screens:

1. **Sandbox workstation** — fake Windows desktop. Classic AV (scan-time + run-time) can miss a packed dummy (`PhotoViewer.crypt.exe`). The neuro-symbolic path still measures at a simulated UEFI gate and watches sandbox assembly/API behavior, so obfuscation does not get a host execute. Safe apps (Paint, Notepad, Calculator) still open after they clear.
2. **Campaign lab** — network-map race of dummy specimens vs the two detectors.

No Python server is required to host it. The firmware gate is a **UI simulation**, not real BIOS/UEFI control.

## Local

```bash
cd web
npm install
npm run dev
```

Open the URL Vite prints (usually http://127.0.0.1:5173).

## Build for hosting

```bash
cd web
npm install
npm run build
```

Upload the `web/dist` folder to any static host.

### Vercel

1. Import the GitHub repo
2. Set **Root Directory** to `web`
3. Framework: Vite (defaults are fine)
4. Deploy

Or from this folder:

```bash
cd web
npx vercel
```

### Netlify

1. Base directory: `web`
2. Build command: `npm run build`
3. Publish directory: `dist`

### GitHub Pages

```bash
cd web
npm install
npm run build
```

Publish the contents of `dist` (Actions or the `gh-pages` branch). `vite.config.js` uses `base: "./"` so it works in a subdirectory.

## Railway

The repo root is a Python research project, so Railway must be told to serve the React lab.

This branch already includes `railpack.json` (`provider: node`) and `node server.mjs`. Redeploy the same service from `cursor/neurosymbolic-security-world-model-6004`. Do **not** set a Root Directory of `/` without that file — Railpack will detect Python and fail.

If you instead set Railway **Root Directory** to `web`, Railpack detects Vite and uses `npm run build` / `npm start` there.

## Regenerating detector traces

If you change the Python world model:

```bash
python -m demo.export_static
cd web && npm run build
```
