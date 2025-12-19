#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#
set -x
set -e

typescript-json-schema "tsconfig.schema.json" "*" --out "dist/schema.json" --refs false --required true