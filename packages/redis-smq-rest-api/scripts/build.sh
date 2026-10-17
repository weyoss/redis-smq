#!/bin/bash

#
# packages/redis-smq-rest-api-refactor/src/scripts/build.sh
#

set -euxo pipefail

# Always operate from the package root, regardless of the invocation cwd.
cd "$(dirname "$0")/.."

# ─────────────────────────────────────────────────────────────────────
# Clean
# ─────────────────────────────────────────────────────────────────────
rm -rf dist

# Generates dist/assets/schema.json by running ts-json-schema-generator
# over every *DTO.ts file under src/features/. The script creates
# dist/assets/ if needed. tsc does not touch this directory, so the
# file survives the compile steps below.
./scripts/gen-json-schema.sh

# ─────────────────────────────────────────────────────────────────────
# Compile
# ─────────────────────────────────────────────────────────────────────

# ESM build → dist/
tsc -p tsconfig.json

# CJS build → dist/cjs/
tsc -p tsconfig.cjs.json

# CJS needs its own package.json to override the root "type": "module".
cat >dist/cjs/package.json <<'EOF'
{
  "type": "commonjs"
}
EOF

# Make the CLI entry points executable so `npx redis-smq-rest-api-refactor`
# and direct `./dist/cli.js` invocations both work.
chmod +x dist/esm/src/cli.js dist/cjs/src/cli.js

# ─────────────────────────────────────────────────────────────────────
# Codegen from compiled output
#
# The OpenAPI document is built from the compiled route table — the
# `routes` array in dist/features/routes.js. This step must run after
# tsc, because it imports compiled JS rather than reading source.
# ─────────────────────────────────────────────────────────────────────
./scripts/gen-openapi.js

echo "✅ Build complete."