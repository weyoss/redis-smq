#!/bin/bash

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

echo "Generating API client ..."
orval
echo "API client generated successfully in src/api/generated"
