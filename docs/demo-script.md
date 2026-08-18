# Three-minute demo script

## 0:00–0:12 — Show the failure, not a title slide

“An AI sales agent is about to tell Acme that Phoenix launches August 30. Watch what happens before it sends.”

Click **Execute action**. The screen returns `BLOCK`.

## 0:12–0:42 — Explain the evidence path

“ContextGate found that August 30 was superseded. Linear records September 14, Slack contains the approved decision, and the GitHub milestone agrees. It did not ask an LLM whether the email sounded plausible. HydraDB traversed the temporal evidence graph.”

Point to the evidence timeline and traversal path.

## 0:42–1:05 — Show a safe action

Select **Send corrected launch update**, execute it, and show `ALLOW`.

“The corrected action is backed by multiple current sources, so the exact same policy allows it.”

## 1:05–1:27 — Show abstention

Select **Change data residency** and execute it.

“No qualifying evidence path exists for Frankfurt. ContextGate says `CLARIFY` instead of inventing an answer or treating absence as proof.”

## 1:27–2:05 — Show why HydraDB matters

“The graph resolves aliases across systems, retains old claims through `SUPERSEDES`, attaches every claim to its source, and traverses the path from proposed action to current authority. A vector search can retrieve similar documents; it cannot establish this authorization chain.”

Show the HydraDB adapter and OpenCypher seed statements briefly.

## 2:05–2:30 — Evidence, not claims

“Our live 30-case safety suite covers 30 distinct supported, superseded, and unsupported actions. The evaluator writes every fixture to HydraDB, reads it back, and measures the complete decision externally. These are synthetic demo-system results, and we show only the artifact produced by this live run.”

Do not record this segment unless `evidence/live-evaluation.json` and `evidence/hydradb-roundtrip.jsonl` were generated in the same HydraDB-backed session. Memory mode is prohibited for the submission video.

## 2:30–2:50 — Close

“Enterprise AI should not act because a fact is similar. It should act only when the evidence graph authorizes it. ContextGate: evidence before agent action.”
