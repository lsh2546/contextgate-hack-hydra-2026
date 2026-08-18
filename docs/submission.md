# Hack Hydra submission draft

## Project name

ContextGate

## Short description

ContextGate is an evidence-backed pre-execution control layer that stops enterprise AI agents from sending messages or changing business systems using stale, contradictory, or unsupported context.

## Problem

Enterprise agents increasingly act across email, CRM, project management, and code systems. Retrieval can find plausible context, but it does not prove that a fact is current, authoritative, or safe to act on. A confident agent can therefore send a customer an obsolete launch date or update a system using a claim the company never established.

## What we built

ContextGate intercepts an action, extracts its factual assertion, and traverses a temporal evidence graph. It returns `ALLOW`, `BLOCK`, or `CLARIFY`, accompanied by the exact sources and relationships behind the decision. The demo shows a stale customer email being blocked, a corrected email being allowed, and an unsupported CRM update being routed to a human.

## How HydraDB is used

HydraDB stores cross-application entities, claims, sources, aliases, and temporal relationships. ContextGate writes and queries the graph through HydraDB's authenticated HTTP OpenCypher endpoint. `SUPERSEDES`, `SUPPORTS`, `CONTRADICTS`, `DERIVED_FROM`, and `SAME_AS` relationships preserve evidence lineage. Snapshot-consistent traversal makes the authorization decision explainable and reproducible. Removing HydraDB removes identity resolution, temporal lineage, and the multi-hop evidence path that the gate requires.

## Track

Track 1 — Enterprise Context & Ontology

## Technology

HydraDB OSS, OpenCypher HTTP API, Node.js, browser-native JavaScript and CSS.

## Verified results

In one reproducible GitHub-hosted CI run over 30 distinct synthetic assertions, ContextGate matched all 30 expected decisions, produced zero false authorizations, and measured 5.89 ms p95 external read-plus-decision latency. The live run used the official HydraDB container and preserved every query, response, decision, and container log. These results describe the deterministic synthetic demo suite, not production performance or general model accuracy.

## Why it is different

Knowledge assistants answer questions. ContextGate controls whether an AI agent may take an external action. It places an evidence gate directly before email, CRM, and project-management mutations and fails closed when facts are stale, contradicted, or unsupported.

## How to judge it

Open the public demo and execute the three pending actions in order. The obsolete date returns `BLOCK` with a `SUPERSEDED_BY` evidence path. The corrected date returns `ALLOW` from multiple current sources. The unsupported data-residency update returns `CLARIFY` with no invented evidence. The header must show `HydraDB OpenCypher · causal snapshot` throughout.

## Links

- Public repository: https://github.com/lsh2546/contextgate-hack-hydra-2026
- Demo: https://contextgate-u4dj5xorbq-du.a.run.app/
- Live HydraDB verification: https://github.com/lsh2546/contextgate-hack-hydra-2026/actions/runs/32094568468
- Public deployment verification: https://github.com/lsh2546/contextgate-hack-hydra-2026/actions/runs/32095547319
- Video: TBD
