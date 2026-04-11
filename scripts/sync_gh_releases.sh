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

. scripts/setup_env.sh

pnpm exec redis-smq-ci sync-releases "$@"
