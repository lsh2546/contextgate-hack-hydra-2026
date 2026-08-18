import test from "node:test";
import assert from "node:assert/strict";
import { buildEvaluationSuite } from "../scripts/evaluation-suite.js";

test("live evaluation defines 30 distinct actions and assertions", () => {
  const suite = buildEvaluationSuite();
  assert.equal(suite.cases.length, 30);
  assert.equal(new Set(suite.cases.map(item => item.id)).size, 30);
  assert.equal(new Set(suite.cases.map(item => `${item.assertion.subject}|${item.assertion.field}|${item.assertion.value}`)).size, 30);
});

test("live evaluation covers ALLOW, BLOCK, and CLARIFY evenly", () => {
  const suite = buildEvaluationSuite();
  for (const verdict of ["ALLOW", "BLOCK", "CLARIFY"]) {
    assert.equal(suite.cases.filter(item => item.expected === verdict).length, 10);
  }
});

