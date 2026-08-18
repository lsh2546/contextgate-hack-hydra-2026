import test from "node:test";
import assert from "node:assert/strict";
import { actions } from "../src/data.js";
import { evaluateAction } from "../src/engine.js";

for (const action of actions) {
  test(`${action.id} returns ${action.expected}`, () => {
    const result = evaluateAction(action);
    assert.equal(result.decision, action.expected);
    assert.ok(result.reason);
    assert.ok(result.confidence >= 0 && result.confidence <= 1);
  });
}

test("unsupported assertions abstain instead of inventing evidence", () => {
  const action = { id: "unknown", actor: "Agent", assertion: { subject: "Unknown", field: "unknown", value: "x" } };
  const result = evaluateAction(action);
  assert.equal(result.decision, "CLARIFY");
  assert.equal(result.path.length, 0);
});

test("superseded claims expose an evidence path", () => {
  const result = evaluateAction(actions[0]);
  assert.equal(result.decision, "BLOCK");
  assert.ok(result.evidence.some(e => e.status === "superseded"));
  assert.ok(result.path.some(edge => edge.relationship === "SUPERSEDED_BY"));
  assert.ok(result.path.some(edge => edge.relationship === "DERIVED_FROM"));
});
