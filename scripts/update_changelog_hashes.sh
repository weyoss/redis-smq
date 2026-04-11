#!/bin/bash

#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

# Description: Replaces old commit hashes with new ones in all CHANGELOG.md files
#              using the mapping from .git/filter-repo/commit-map
#              Handles: ./CHANGELOG.md and ./packages/*/CHANGELOG.md

set -euo pipefail

. scripts/setup_env.sh

pnpm exec redis-smq-ci update-changelog-hashes "$@"