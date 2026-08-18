import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const expected = new Map([
  ["act-block", "BLOCK"],
  ["act-allow", "ALLOW"],
  ["act-clarify", "CLARIFY"]
]);
const results = [];

for (const [id, verdict] of expected) {
  const started = performance.now();
  const response = await fetch(`http://127.0.0.1:4173/api/evaluate/${id}`, { method: "POST" });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  assert.equal(body.backend, "hydradb");
  assert.equal(body.decision, verdict);
  results.push({ id, expected: verdict, actual: body.decision, backend: body.backend, externalLatencyMs: performance.now() - started, path: body.path });
}

await writeFile(new URL("../evidence/live-decisions.json", import.meta.url), `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));

