#!/bin/bash

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

echo "Cleaning up old files ..."
rm -rf src/api/generated
rm -rf src/api/model

echo "Generating API client ..."
orval
echo "API client generated successfully in src/api/generated"
