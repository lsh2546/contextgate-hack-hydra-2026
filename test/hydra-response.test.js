import test from "node:test";
import assert from "node:assert/strict";
import { HydraDBClient } from "../src/hydra.js";

test("HydraDB typed HTTP rows decode into named properties", () => {
  const client = new HydraDBClient({ HYDRADB_MODE: "memory" });
  const rows = client.decodeRows({
    columns: ["id", "authority"],
    rows: [[{ type: "string", value: "claim-1" }, { type: "float", value: 0.92 }]]
  });
  assert.deepEqual(rows, [{ id: "claim-1", authority: 0.92 }]);
});

test("HydraDB record wrappers decode into named properties", () => {
  const client = new HydraDBClient({ HYDRADB_MODE: "memory" });
  const rows = client.decodeRows({
    columns: ["id", "status"],
    records: [{ values: [{ type: "string", value: "claim-2" }, { type: "string", value: "current" }] }]
  });
  assert.deepEqual(rows, [{ id: "claim-2", status: "current" }]);
});

