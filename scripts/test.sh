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
export NODE_OPTIONS="$NODE_OPTIONS --trace-warnings"
npm run build
jest --runInBand --verbose --collectCoverage "$@"
