#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

set -euxo pipefail

#typescript-json-schema "tsconfig.schema.json" "*" --out "dist/schema.json" --refs true --aliasRefs --required true
ts-json-schema-generator --tsconfig tsconfig.schema.json --out "dist/assets/schema.json" --strict-tuples --type "*"

./scripts/validate_json_schema.js