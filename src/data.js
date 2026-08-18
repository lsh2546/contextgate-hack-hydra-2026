export const sources = [
  { id: "src-sales", kind: "Gmail", title: "Acme launch commitment", authority: 0.62, at: "2026-08-02T09:12:00Z" },
  { id: "src-slack", kind: "Slack", title: "#phoenix launch decision", authority: 0.78, at: "2026-08-08T16:40:00Z" },
  { id: "src-linear", kind: "Linear", title: "PHX-482 milestone", authority: 0.92, at: "2026-08-09T10:05:00Z" },
  { id: "src-gh", kind: "GitHub", title: "release/phoenix milestone", authority: 0.96, at: "2026-08-09T13:20:00Z" },
  { id: "src-crm", kind: "HubSpot", title: "Acme account timeline", authority: 0.74, at: "2026-08-12T08:00:00Z" },
  { id: "src-hr", kind: "Drive", title: "Phoenix ownership roster", authority: 0.88, at: "2026-08-07T08:00:00Z" }
];

export const claims = [
  { id: "launch-old", subject: "Acme.Phoenix", field: "launch_date", value: "2026-08-30", source: "src-sales", at: "2026-08-02T09:12:00Z", status: "superseded" },
  { id: "launch-new", subject: "Acme.Phoenix", field: "launch_date", value: "2026-09-14", source: "src-linear", at: "2026-08-09T10:05:00Z", status: "current", supersedes: "launch-old" },
  { id: "launch-slack", subject: "Acme.Phoenix", field: "launch_date", value: "2026-09-14", source: "src-slack", at: "2026-08-08T16:40:00Z", status: "supporting" },
  { id: "launch-gh", subject: "Acme.Phoenix", field: "launch_date", value: "2026-09-14", source: "src-gh", at: "2026-08-09T13:20:00Z", status: "supporting" },
  { id: "owner", subject: "Acme.Phoenix", field: "owner", value: "Soham Ratnaparkhi", source: "src-hr", at: "2026-08-07T08:00:00Z", status: "current" },
  { id: "tier", subject: "Acme", field: "support_tier", value: "Enterprise", source: "src-crm", at: "2026-08-12T08:00:00Z", status: "current" }
];

export const aliases = [
  { alias: "@soham", canonical: "Soham Ratnaparkhi", evidence: "same verified email and project membership", confidence: 0.99 },
  { alias: "S. Ratnaparkhi", canonical: "Soham Ratnaparkhi", evidence: "same email, team and activity window", confidence: 0.97 }
];

export const actions = [
  {
    id: "act-block", title: "Send launch confirmation", tool: "Gmail", actor: "Sales Agent", customer: "Acme",
    payload: "Hi Acme — Phoenix remains on schedule for August 30, 2026.",
    assertion: { subject: "Acme.Phoenix", field: "launch_date", value: "2026-08-30" }, expected: "BLOCK"
  },
  {
    id: "act-allow", title: "Send corrected launch update", tool: "Gmail", actor: "Sales Agent", customer: "Acme",
    payload: "Hi Acme — Phoenix is scheduled for September 14, 2026.",
    assertion: { subject: "Acme.Phoenix", field: "launch_date", value: "2026-09-14" }, expected: "ALLOW"
  },
  {
    id: "act-clarify", title: "Change data residency", tool: "HubSpot", actor: "Account Agent", customer: "Acme",
    payload: "Set Acme data residency to Frankfurt.",
    assertion: { subject: "Acme", field: "data_residency", value: "Frankfurt" }, expected: "CLARIFY"
  }
];
