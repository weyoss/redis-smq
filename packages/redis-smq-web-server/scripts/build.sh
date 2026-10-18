#!/bin/bash

#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

set -euxo pipefail

# Anchor to the package root. `pnpm build` and direct invocations from
# anywhere resolve the same paths.
cd "$(dirname "$0")/.."

# ─────────────────────────────────────────────────────────────────────
# 0. Clean
# ─────────────────────────────────────────────────────────────────────
rm -rf dist

# ─────────────────────────────────────────────────────────────────────
# 1. ESM build → dist/esm/
# ─────────────────────────────────────────────────────────────────────
tsc -p tsconfig.json

# ─────────────────────────────────────────────────────────────────────
# 2. CJS build → dist/cjs/
# ─────────────────────────────────────────────────────────────────────
tsc -p tsconfig.cjs.json
printf '{"type":"commonjs"}\n' > dist/cjs/package.json

echo "✅ Build complete."