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

rm -rf dist

# esm
tsc -p ./tsconfig.json
cp -r src/common/redis/ dist/esm/src/common/redis/
cp -r src/common/background-job/redis/ dist/esm/src/common/background-job/redis/

# cjs
tsc -p ./tsconfig.cjs.json
cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF
cp -r src/common/redis/ dist/cjs/src/common/redis/
cp -r src/common/background-job/redis/ dist/cjs/src/common/background-job/redis/
