#!/usr/bin/env bash

#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

pnpm exec redis-smq-ci consolidate-changelog CHANGELOG.md --force --verbose --no-metadata --output-dir release-notes
