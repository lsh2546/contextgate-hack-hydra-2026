import { sources, claims, aliases } from "./data.js";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export class HydraDBClient {
  constructor(env = process.env) {
    this.url = env.HYDRADB_URL || "http://127.0.0.1:8443";
    this.token = env.HYDRADB_TOKEN || "local-development-token-32-bytes";
    this.namespace = env.HYDRADB_NAMESPACE || "default";
    this.graph = env.HYDRADB_GRAPH_ID || "default";
    this.cell = env.HYDRADB_CELL_ID || "cell-0";
    this.mode = env.HYDRADB_MODE || "hydra";
    this.connected = false;
    this.lastError = null;
    this.auditPath = env.HYDRADB_AUDIT_PATH || join(dirname(fileURLToPath(import.meta.url)), "..", "evidence", "hydradb-roundtrip.jsonl");
  }

  async query(query, consistency = "causal") {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    try {
      const response = await fetch(`${this.url}/v1/graphs/${this.graph}/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "X-Graph-Namespace": this.namespace, "Content-Type": "application/json" },
        body: JSON.stringify({ cell_id: this.cell, query, consistency }), signal: AbortSignal.timeout(10000)
      });
      const raw = await response.text();
      if (!response.ok) throw new Error(`HydraDB HTTP ${response.status}: ${raw.slice(0, 300)}`);
      const result = raw ? JSON.parse(raw) : {};
      await this.audit({ startedAt, elapsedMs: performance.now() - started, consistency, query, ok: true, result });
      return result;
    } catch (error) {
      await this.audit({ startedAt, elapsedMs: performance.now() - started, consistency, query, ok: false, error: error.message });
      throw error;
    }
  }

  async audit(record) {
    await mkdir(dirname(this.auditPath), { recursive: true });
    await appendFile(this.auditPath, `${JSON.stringify(record)}\n`, "utf8");
  }

  async health() {
    if (this.mode === "memory") return { mode: "memory", connected: false, label: "Deterministic graph replica" };
    try {
      // HydraDB's current HTTP OpenCypher engine accepts node reads, but not
      // count(n). This query succeeds both before and after the graph is seeded.
      await this.query("MATCH (n:Claim) RETURN n.id AS id LIMIT 1");
      this.connected = true;
      return { mode: "hydradb", connected: true, label: "HydraDB OpenCypher · causal snapshot" };
    } catch (error) {
      this.lastError = error.message;
      return { mode: "hydra", connected: false, label: "HydraDB required · unavailable", detail: error.message };
    }
  }

  async seed() {
    const sourceId = id => 2001 + sources.findIndex(s => s.id === id);
    const claimId = id => 1001 + claims.findIndex(c => c.id === id);
    const aliasId = index => 3001 + index;
    const claimNode = c => `:Claim {id:${claimId(c.id)}, claim_id:'${c.id}', subject:'${c.subject}', field:'${c.field}', value:'${c.value}', status:'${c.status}', at:'${c.at}'}`;
    const sourceNode = s => `:Source {id:${sourceId(s.id)}, source_id:'${s.id}', kind:'${s.kind}', authority:${s.authority}, at:'${s.at}'}`;
    // HydraDB 0.1.x executes CREATE/MERGE as one-hop edge patterns. Creating
    // isolated nodes first is therefore both unnecessary and unsupported.
    const statements = [
      ...claims.map(c => {
        const source = sources.find(s => s.id === c.source);
        return `MERGE (c${claimNode(c)})-[:DERIVED_FROM]->(s${sourceNode(source)})`;
      }),
      ...claims.filter(c => c.supersedes).map(c => {
        const older = claims.find(item => item.id === c.supersedes);
        return `MERGE (newer${claimNode(c)})-[:SUPERSEDES]->(older${claimNode(older)})`;
      }),
      ...aliases.map((a, i) => {
        const target = claims.find(c => c.subject === a.canonical) || claims[0];
        return `MERGE (a:Alias {id:${aliasId(i)}, alias_id:'alias-${i}', value:'${a.alias}', canonical:'${a.canonical}', confidence:${a.confidence}})-[:SAME_AS]->(c${claimNode(target)})`;
      })
    ];
    const results = [];
    for (const statement of statements) results.push(await this.query(statement, "strong"));
    return { statements: statements.length, results };
  }

  async evidenceGraph(subject, field) {
    const escape = value => String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
    const result = await this.query(
      `MATCH (c:Claim {subject:'${escape(subject)}', field:'${escape(field)}'})-[:DERIVED_FROM]->(s:Source) OPTIONAL MATCH (newer:Claim)-[:SUPERSEDES]->(c) RETURN c.claim_id AS id, c.subject AS subject, c.field AS field, c.value AS value, c.status AS stored_status, c.at AS at, s.source_id AS source, s.kind AS source_kind, s.authority AS source_authority, newer.claim_id AS superseded_by`,
      "strong"
    );
    const rows = this.decodeRows(result);
    const selectedClaims = rows.map(row => ({
      id: row.id,
      subject: row.subject,
      field: row.field,
      value: row.value,
      // The live SUPERSEDES edge takes precedence over a stored label.
      status: row.superseded_by ? "superseded" : row.stored_status,
      at: row.at,
      source: row.source,
      ...(row.superseded_by ? { supersededBy: row.superseded_by } : {})
    }));
    for (const claim of selectedClaims) {
      if (!claim.supersededBy) continue;
      const replacement = selectedClaims.find(candidate => candidate.id === claim.supersededBy);
      if (replacement) replacement.supersedes = claim.id;
    }
    const selectedSources = [...new Map(rows.map(row => [row.source, { id: row.source, kind: row.source_kind, authority: Number(row.source_authority), at: row.at }])).values()];
    return { sources: selectedSources, claims: selectedClaims, aliases: [] };
  }

  decodeRows(payload) {
    const unwrap = value => {
      if (value && typeof value === "object" && value.type === "null") return null;
      return value && typeof value === "object" && "value" in value ? value.value : value;
    };
    const columns = payload.columns || payload.keys || payload.fields;
    const rows = payload.rows || payload.records || payload.data;
    if (!Array.isArray(columns) || !Array.isArray(rows)) throw new Error("Unrecognized HydraDB HTTP row format");
    return rows.map(entry => {
      const values = Array.isArray(entry) ? entry : entry.row || entry.values || entry.record;
      if (!Array.isArray(values)) throw new Error("Unrecognized HydraDB HTTP record format");
      return Object.fromEntries(columns.map((column, index) => [column, unwrap(values[index])]));
    });
  }
}
