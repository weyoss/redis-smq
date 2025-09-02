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

# clean up
rm -rf dist

pnpm generate-openapi-client

# vue app
vue-tsc --build
vite build .

# node-utils esm
tsc  -p ./tsconfig.node-utils.json

# node-utils cjs
tsc  -p ./tsconfig.node-utils.cjs.json
cat >dist/node/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF