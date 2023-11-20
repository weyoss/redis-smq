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

npm run type-coverage
npm run lint
npm run format
rm -rf dist
tsc
cp -r src/common/redis-client/lua dist/src/common/redis-client/