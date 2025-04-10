#
# Copyright (c)
# Weyoss <weyoss@protonmail.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

set -x
set -e

rm -rf dist

# esm
tsc -p ./tsconfig.json
cp -r src/redis-client/lua-scripts dist/esm/src/redis-client/
cp -r src/redis-lock/lua-scripts dist/esm/src/redis-lock/
cp -r tests/redis-client/lua-scripts dist/esm/tests/redis-client/
chmod +x dist/esm/bin/cli.js

# cjs
tsc -p ./tsconfig.cjs.json
cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF
cp -r src/redis-client/lua-scripts dist/cjs/src/redis-client/
cp -r src/redis-lock/lua-scripts dist/cjs/src/redis-lock/
cp -r tests/redis-client/lua-scripts dist/cjs/tests/redis-client/
chmod +x dist/cjs/bin/cli.js

