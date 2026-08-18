import { sources, claims, aliases } from "./data.js";

const byId = (items, id) => items.find(x => x.id === id);

export function evaluateAction(action, graph = { sources, claims, aliases }) {
  const started = performance.now();
  const { subject, field, value } = action.assertion;
  const relevant = graph.claims.filter(c => c.subject === subject && c.field === field);
  const evidence = relevant.map(c => ({ ...c, sourceDetail: byId(graph.sources, c.source) }))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  const current = evidence.filter(c => c.status === "current" || c.status === "supporting");
  const exact = current.filter(c => c.value === value);
  const contradictions = current.filter(c => c.value !== value);
  const superseded = evidence.find(c => c.value === value && c.status === "superseded");

  let decision;
  let reason;
  if (!relevant.length) {
    decision = "CLARIFY";
    reason = "No evidence path exists for this assertion. Human confirmation is required.";
  } else if (superseded && contradictions.length) {
    decision = "BLOCK";
    reason = `The proposed value was superseded by ${contradictions[0].value}.`;
  } else if (exact.length >= 2 || (exact.length === 1 && exact[0].sourceDetail?.authority >= 0.85)) {
    decision = "ALLOW";
    reason = `${exact.length} current evidence source${exact.length === 1 ? "" : "s"} support the assertion.`;
  } else if (contradictions.length) {
    decision = "BLOCK";
    reason = `Current authoritative evidence contradicts the proposed value.`;
  } else {
    decision = "CLARIFY";
    reason = "Evidence exists but is not sufficient to authorize execution.";
  }

  const confidence = decision === "ALLOW"
    ? Math.min(0.99, exact.reduce((s, c) => s + (c.sourceDetail?.authority || 0), 0) / Math.max(1, exact.length) + exact.length * 0.03)
    : decision === "BLOCK" ? 0.98 : 0.41;

  let path = [];
  if (decision === "BLOCK" && superseded) {
    const replacement = evidence.find(c => c.supersedes === superseded.id);
    path = [
      { from: action.actor, relationship: "PROPOSES", to: superseded.id, label: `Claim: ${superseded.value}` },
      ...(replacement ? [{ from: superseded.id, relationship: "SUPERSEDED_BY", to: replacement.id, label: `Current claim: ${replacement.value}` }] : []),
      ...(replacement?.sourceDetail ? [{ from: replacement.id, relationship: "DERIVED_FROM", to: replacement.source, label: `${replacement.sourceDetail.kind} evidence` }] : [])
    ];
  } else if (decision === "ALLOW") {
    path = exact.flatMap((claim, index) => [
      ...(index === 0 ? [{ from: action.actor, relationship: "USES", to: claim.id, label: `Current claim: ${claim.value}` }] : []),
      { from: claim.id, relationship: "DERIVED_FROM", to: claim.source, label: `${claim.sourceDetail?.kind || "Source"} evidence` }
    ]);
  }

  return {
    actionId: action.id, decision, reason, confidence: Number(confidence.toFixed(2)),
    latencyMs: Number((performance.now() - started).toFixed(3)),
    assertion: action.assertion, evidence, path,
    policy: "CG-TEMPORAL-EVIDENCE-v1",
    checkedAt: new Date().toISOString()
  };
}

export function graphSnapshot(graph = { sources, claims, aliases }) {
  const nodes = [
    { id: "agent", type: "Agent", label: "Sales Agent" },
    { id: "acme", type: "Customer", label: "Acme" },
    { id: "phoenix", type: "Project", label: "Phoenix" },
    ...graph.claims.map(c => ({ id: c.id, type: "Claim", label: c.value, status: c.status })),
    ...graph.sources.map(s => ({ id: s.id, type: "Source", label: s.kind }))
  ];
  const edges = [
    { from: "agent", to: "acme", type: "ACTS_FOR" },
    { from: "acme", to: "phoenix", type: "HAS_PROJECT" },
    ...graph.claims.flatMap(c => [
      { from: "phoenix", to: c.id, type: "HAS_CLAIM" },
      { from: c.id, to: c.source, type: "DERIVED_FROM" },
      ...(c.supersedes ? [{ from: c.id, to: c.supersedes, type: "SUPERSEDES" }] : [])
    ])
  ];
  return { nodes, edges };
}
