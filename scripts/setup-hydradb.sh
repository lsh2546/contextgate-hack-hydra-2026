#!/usr/bin/env sh
set -eu
mkdir -p .hydradb/store .hydradb/cache
printf '%s\n' 'local-development-token-32-bytes' > .hydradb/auth-token
echo "HydraDB data directories are ready. Run: docker compose up hydradb"
