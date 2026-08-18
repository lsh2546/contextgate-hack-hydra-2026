# Verification status

## Verified in this workspace

- Node test suite: 10/10 passing.
- The live evaluation suite defines 30 unique action IDs and 30 unique assertions.
- Default mode is fail-closed when HydraDB is unavailable.
- Memory mode activates only when `HYDRADB_MODE=memory` is explicitly set.
- Synthetic policy checks return the expected ALLOW, BLOCK, and CLARIFY decisions.
- The UI and API run successfully in explicit development-only memory mode.

## Verified against live HydraDB

GitHub Actions run [32094397771](https://github.com/lsh2546/contextgate-hack-hydra-2026/actions/runs/32094397771) completed successfully against the official `ghcr.io/hydra-db/hydradb:latest` image on Ubuntu.

- HydraDB graph writes succeeded through HTTP OpenCypher.
- Claims, source metadata, and `DERIVED_FROM` / `SUPERSEDES` relationships were read back from HydraDB.
- Live demo decisions returned the expected BLOCK, ALLOW, and CLARIFY results.
- The external 30-case runner observed 30 expected decisions out of 30 and zero false authorizations.
- Externally measured read-plus-decision p95 in that run was 5.89 ms.
- Container, round-trip, decision, and evaluation logs are preserved in `evidence/` and in the workflow artifact.

These results apply only to the deterministic synthetic demo suite and one GitHub-hosted run. They are not production benchmarks or general model-accuracy claims.

## Reproduce before recording

Run the submission demo only in HydraDB mode:

```bash
sh scripts/setup-hydradb.sh
docker compose up hydradb
HYDRADB_MODE=hydra npm start
curl -X POST http://127.0.0.1:4173/api/seed
npm run evaluate:live
```

The session regenerates:

- `evidence/hydradb-roundtrip.jsonl`
- `evidence/live-evaluation.json`

Do not record the submission video in memory mode. If a new run produces different results, report the new artifact rather than the historical CI values above.
