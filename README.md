# ContextGate

**Evidence-backed pre-execution control for enterprise AI agents.**

ContextGate stops an enterprise agent before it sends an email, updates a CRM, or changes a project record using stale, contradictory, or unsupported information. It returns one explainable decision:

- `ALLOW` — authoritative current evidence supports the action.
- `BLOCK` — a temporal or contradictory evidence path invalidates it.
- `CLARIFY` — the graph cannot justify the action, so a human must decide.

## The three-second demo

A sales agent is about to email Acme that Phoenix launches on August 30. ContextGate traverses the HydraDB evidence graph, finds that Linear, Slack, and GitHub superseded that date with September 14, and blocks the email before it is sent. Correct the date and the same policy allows it. Ask the agent to set an unsupported data-residency value and it abstains.

## Why HydraDB is core

This is not RAG with a graph-shaped screenshot. ContextGate uses HydraDB's OpenCypher API for graph mutations and snapshot-consistent traversal. Claims are never overwritten: `SUPERSEDES`, `CONTRADICTS`, `SUPPORTS`, `DERIVED_FROM`, and `SAME_AS` relationships preserve identity, time, provenance, and authority.

The action gate depends on multi-hop evidence paths. Without HydraDB, ContextGate loses:

1. temporal lineage between current and superseded claims;
2. cross-application entity resolution;
3. explainable source-to-claim-to-action paths;
4. deterministic abstention when no qualifying path exists.

## Run the submission demo with HydraDB

The submission demo is fail-closed: HydraDB is required and no decision is returned when the database is unavailable.

```bash
sh scripts/setup-hydradb.sh
docker compose up hydradb
```

In another terminal:

```bash
HYDRADB_MODE=hydra npm start
curl -X POST http://127.0.0.1:4173/api/seed
```

Open `http://127.0.0.1:4173`. Every `ALLOW`, `BLOCK`, and `CLARIFY` decision is computed from claims and relationships read from HydraDB. Successful and failed HTTP round trips are appended to `evidence/hydradb-roundtrip.jsonl` with the query, response, and externally measured elapsed time.

## Run with the official HydraDB image

HydraDB's official image exposes Bolt on `7687`, HTTP OpenCypher on `8443`, and admin endpoints on `9090`.

The adapter sends authenticated queries to:

```text
POST /v1/graphs/default/query
Authorization: Bearer local-development-token-32-bytes
X-Graph-Namespace: default
```

### Development-only memory mode

For UI development without Docker, explicitly opt into the isolated replica:

```bash
HYDRADB_MODE=memory npm start
```

Memory mode is development-only. It is prohibited for the submission recording and cannot silently activate when HydraDB fails.

## Verification

```bash
npm test
npm run evaluate:live
```

`CG-LIVE-EVAL-30-v2` contains 30 distinct actions and assertions: ten supported current actions, ten superseded actions, and ten unsupported actions across ten separately named customers. The live runner writes those fixtures to HydraDB, reads each evidence graph back through HTTP OpenCypher, computes the decision from the returned rows, and measures the complete read-plus-decision duration outside the policy engine. It writes results only after a successful live run to `evidence/live-evaluation.json`.

No accuracy or latency result is claimed in this repository until that live artifact exists. The fixtures are synthetic and any resulting metrics apply only to this deterministic demo suite.

The `Live HydraDB verification` GitHub Actions workflow runs the same sequence on Ubuntu using the official image. It uploads the container log, every HTTP query/response, three live demo decisions, and the 30-case evaluation as downloadable CI evidence.

## Architecture

```text
Proposed agent action
        │
        ▼
Assertion extraction (subject / field / value)
        │
        ▼
HydraDB temporal evidence traversal
        │
        ├── current authoritative path ──► ALLOW
        ├── superseded / contradiction ──► BLOCK
        └── no sufficient path ──────────► CLARIFY
```

## Repository layout

```text
src/hydra.js       official HydraDB HTTP OpenCypher adapter and seeding
src/engine.js      deterministic ALLOW/BLOCK/CLARIFY policy over queried rows
src/data.js        synthetic cross-application evidence fixture
public/            interactive judge-facing demo
test/              behavior and safety regression tests
scripts/evaluate-live.js 30-case external HydraDB evaluation
```

## Hack Hydra track

Track 1 — Enterprise Context & Ontology. ContextGate turns entity resolution, conflict handling, temporal supersession, multi-hop reasoning, and abstention into an actual enforcement product rather than another company-document chatbot.

## Attribution

- [HydraDB](https://github.com/hydra-db/hydradb), AGPL-3.0, used as the graph database through its published HTTP API and container image.
- No third-party application libraries are bundled.

ContextGate source is licensed under Apache-2.0. HydraDB remains under its own AGPL-3.0 license.
