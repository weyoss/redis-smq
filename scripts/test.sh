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

export NODE_ENV=test
npm run build
cat >dist/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF
jest --runInBand --verbose --collectCoverage "$@"