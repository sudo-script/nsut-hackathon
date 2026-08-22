import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "web", "dist");
const port = Number(process.env.PORT || 8080);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function send(res, file, type, status = 200) {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-cache",
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const relative = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  const requested = relative ? path.join(root, relative) : path.join(root, "index.html");
  const fallback = path.join(root, "index.html");

  if (fs.existsSync(requested) && fs.statSync(requested).isFile()) {
    send(res, requested, types[path.extname(requested)] || "application/octet-stream");
    return;
  }
  if (fs.existsSync(fallback)) {
    send(res, fallback, types[".html"]);
    return;
  }
  res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
  res.end("web/dist is missing. Run npm run build first.");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Simulation lab listening on 0.0.0.0:${port}`);
});
