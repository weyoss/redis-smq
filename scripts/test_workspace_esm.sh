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

export NODE_ENV=test

test_project() {
  # Set default Jest configuration options
  local VITEST_OPTIONS=(--root ./dist/esm)

  echo "Building the project..."
  if ! pnpm build; then
    echo "Build process failed."
    return 1
  fi

  # Run tests with Jest
  echo "Running tests..."
  export NODE_OPTIONS="--experimental-vm-modules"
  if ! vitest "${VITEST_OPTIONS[@]}" "$@"; then
    echo "Test execution failed."
    return 1
  fi
}
echo "Running tests..."
test_project "$@"