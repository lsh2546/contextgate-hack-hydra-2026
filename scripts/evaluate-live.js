import { writeFile } from "node:fs/promises";
import { HydraDBClient } from "../src/hydra.js";
import { evaluateAction } from "../src/engine.js";
import { buildEvaluationSuite } from "./evaluation-suite.js";

const quote = value => `'${String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
const hydra = new HydraDBClient({ ...process.env, HYDRADB_MODE: "hydra" });
const status = await hydra.health();
if (!status.connected) throw new Error(`Live evaluation requires HydraDB: ${status.detail}`);

const suite = buildEvaluationSuite();
for (const group of suite.groups) {
  for (let i = 0; i < group.claims.length; i++) {
    const claim = group.claims[i];
    const sourceIndex = group.sources.findIndex(source => source.id === claim.source);
    const source = group.sources[sourceIndex];
    await hydra.query(`MERGE (c:Claim {id:${group.baseId + 5 + i}, claim_id:${quote(claim.id)}, subject:${quote(claim.subject)}, field:${quote(claim.field)}, value:${quote(claim.value)}, status:${quote(claim.status)}, at:${quote(claim.at)}})-[:DERIVED_FROM]->(s:Source {id:${group.baseId + sourceIndex}, source_id:${quote(source.id)}, kind:${quote(source.kind)}, authority:${source.authority}, at:${quote(source.at)}})`, "strong");
  }
  const newer = group.claims[1];
  const older = group.claims[0];
  const claimPattern = (claim, index) => `:Claim {id:${group.baseId + 5 + index}, claim_id:${quote(claim.id)}, subject:${quote(claim.subject)}, field:${quote(claim.field)}, value:${quote(claim.value)}, status:${quote(claim.status)}, at:${quote(claim.at)}}`;
  await hydra.query(`MERGE (newer${claimPattern(newer, group.claims.indexOf(newer))})-[:SUPERSEDES]->(older${claimPattern(older, group.claims.indexOf(older))})`, "strong");
}

const results = [];
for (const action of suite.cases) {
  const started = performance.now();
  const graph = await hydra.evidenceGraph(action.assertion.subject, action.assertion.field);
  const decision = evaluateAction(action, graph);
  const externalLatencyMs = performance.now() - started;
  results.push({ id: action.id, subject: action.assertion.subject, field: action.assertion.field, expected: action.expected, actual: decision.decision, externalLatencyMs });
}

const latencies = results.map(result => result.externalLatencyMs).sort((a, b) => a - b);
const report = {
  generatedAt: new Date().toISOString(),
  suite: suite.suite,
  backend: "HydraDB HTTP OpenCypher",
  cases: results.length,
  uniqueActionIds: new Set(results.map(result => result.id)).size,
  uniqueAssertions: new Set(suite.cases.map(action => `${action.assertion.subject}|${action.assertion.field}|${action.assertion.value}`)).size,
  correct: results.filter(result => result.expected === result.actual).length,
  falseAuthorizations: results.filter(result => result.expected !== "ALLOW" && result.actual === "ALLOW").length,
  p95ExternalLatencyMs: latencies[Math.ceil(latencies.length * 0.95) - 1],
  results
};
await writeFile(new URL("../evidence/live-evaluation.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
