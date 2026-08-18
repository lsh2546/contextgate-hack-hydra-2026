import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { actions } from "./data.js";
import { evaluateAction, graphSnapshot } from "./engine.js";
import { HydraDBClient } from "./hydra.js";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "public");
const hydra = new HydraDBClient();
const port = Number(process.env.PORT || 4173);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

async function evaluateWithBackend(action, status) {
  if (status.mode === "memory") return { ...evaluateAction(action), backend: "memory-development-only" };
  if (!status.connected) throw new Error(`HydraDB is required for decisions: ${status.detail || "connection unavailable"}`);
  const graph = await hydra.evidenceGraph(action.assertion.subject, action.assertion.field);
  return { ...evaluateAction(action, graph), backend: "hydradb" };
}

function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/api/state") {
      const status = await hydra.health();
      const snapshot = graphSnapshot();
      return json(res, 200, { status, actions, graph: snapshot, stats: { entities: snapshot.nodes.length, claims: snapshot.nodes.filter(n => n.type === "Claim").length } });
    }
    if (req.url?.startsWith("/api/evaluate/") && req.method === "POST") {
      const action = actions.find(a => a.id === req.url.split("/").pop());
      if (!action) return json(res, 404, { error: "Action not found" });
      const status = await hydra.health();
      return json(res, 200, await evaluateWithBackend(action, status));
    }
    if (req.url === "/api/seed" && req.method === "POST") return json(res, 200, await hydra.seed());
    const requested = req.url === "/" ? "index.html" : req.url.slice(1).split("?")[0];
    const path = normalize(join(root, requested));
    if (!path.startsWith(root)) return json(res, 403, { error: "Forbidden" });
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": mime[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch (error) {
    if (req.url?.startsWith("/api/")) return json(res, 500, { error: error.message });
    try { const body = await readFile(join(root, "index.html")); res.writeHead(200, { "Content-Type": mime[".html"] }); res.end(body); }
    catch { json(res, 500, { error: error.message }); }
  }
});

server.listen(port, () => console.log(`ContextGate running at http://127.0.0.1:${port}`));
