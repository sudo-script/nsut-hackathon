# Simulation Lab (React)

Static Vite + React app. Dummy recon / footprint / pentest / theft campaigns are precomputed with XGBoost and the neuro-symbolic world model, then played in the browser. No Python server is required to host it.

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

## Regenerating detector traces

If you change the Python world model:

```bash
python -m demo.export_static
cd web && npm run build
```
