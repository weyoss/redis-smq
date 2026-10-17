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

# ─────────────────────────────────────────────────────────────────────
# 1. Generate
#
# ts-json-schema-generator reads every *DTO.ts file matched by
# tsconfig.schema.json's `include` glob and emits one JSON Schema
# document with a `definitions` map keyed by the exported type name.
#
# Flags:
#   --tsconfig         — narrow config whose `include` is only *DTO.ts
#   --out              — output path (directory must exist)
#   --strict-tuples    — preserves tuple arity for `readonly [200, X]`
#                        so the runtime getResponseSchemas() can split
#                        by status code. This flag is load-bearing:
#                        without it, response DTOs serialize as
#                        unconstrained arrays and every response schema
#                        loses its status/payload structure.
#   --type "*"         — emit a definition for every exported type
# ─────────────────────────────────────────────────────────────────────

mkdir -p dist/assets

ts-json-schema-generator \
  --tsconfig tsconfig.schema.json \
  --out dist/assets/schema.json \
  --strict-tuples \
  --type "*"

# ─────────────────────────────────────────────────────────────────────
# 2. Sanity check
#
# The generator exits 0 even when the glob matched nothing — it just
# writes a document with an empty `definitions` object. The runtime
# would then fail at `getSchema('FooControllerResponseDTO')` with a
# confusing message. Catch the failure here instead, while the error
# is unambiguous.
#
# `node -e` is treated as CommonJS regardless of the package's
# "type": "module", so `require` is available.
# ─────────────────────────────────────────────────────────────────────

node -e "
  const fs = require('fs');
  const path = 'dist/assets/schema.json';

  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error('Failed to read ' + path + ':', err.message);
    process.exit(1);
  }

  const count = Object.keys(doc.definitions ?? {}).length;
  if (count === 0) {
    console.error(
      'schema.json contains no definitions. ' +
      'Check tsconfig.schema.json\\'s include glob and that ' +
      'at least one *DTO.ts file exists under src/features/.'
    );
    process.exit(1);
  }

  console.log('✅ Generated ' + count + ' schema definitions → ' + path);
"