const unsupportedFields = ["data_residency", "renewal_date", "billing_owner", "security_tier", "dpa_status", "region", "support_tier", "contract_term", "sla_minutes", "legal_entity"];

export function buildEvaluationSuite() {
  const cases = [];
  const groups = [];
  for (let i = 0; i < 10; i++) {
    const subject = `EvalCustomer-${String(i + 1).padStart(2, "0")}.Launch`;
    const oldValue = `2026-08-${String(i + 10).padStart(2, "0")}`;
    const newValue = `2026-09-${String(i + 10).padStart(2, "0")}`;
    const sourceIds = [`eval-mail-${i}`, `eval-linear-${i}`, `eval-slack-${i}`];
    const claimIds = [`eval-old-${i}`, `eval-new-${i}`, `eval-support-${i}`];
    const sources = [
      { id: sourceIds[0], kind: "Gmail", authority: 0.62, at: "2026-08-01T00:00:00Z" },
      { id: sourceIds[1], kind: "Linear", authority: 0.95, at: "2026-08-09T00:00:00Z" },
      { id: sourceIds[2], kind: "Slack", authority: 0.82, at: "2026-08-08T00:00:00Z" }
    ];
    const claims = [
      { id: claimIds[0], subject, field: "launch_date", value: oldValue, source: sourceIds[0], at: sources[0].at, status: "superseded" },
      { id: claimIds[1], subject, field: "launch_date", value: newValue, source: sourceIds[1], at: sources[1].at, status: "current", supersedes: claimIds[0] },
      { id: claimIds[2], subject, field: "launch_date", value: newValue, source: sourceIds[2], at: sources[2].at, status: "supporting" }
    ];
    groups.push({ subject, sources, claims, baseId: 10000 + i * 20 });
    cases.push({ id: `block-${i}`, actor: "Evaluation Agent", assertion: { subject, field: "launch_date", value: oldValue }, expected: "BLOCK" });
    cases.push({ id: `allow-${i}`, actor: "Evaluation Agent", assertion: { subject, field: "launch_date", value: newValue }, expected: "ALLOW" });
    cases.push({ id: `clarify-${i}`, actor: "Evaluation Agent", assertion: { subject, field: unsupportedFields[i], value: `unsupported-${i}` }, expected: "CLARIFY" });
  }
  return { suite: "CG-LIVE-EVAL-30-v2", groups, cases };
}

