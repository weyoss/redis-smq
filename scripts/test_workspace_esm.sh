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

export NODE_ENV=test

test_project() {
  # Set default Jest configuration options
  local VITEST_OPTIONS=(--root ./dist/esm)

  # In CI the workspace is already built — either by the build job that
  # uploads artifacts, or by the workflow's build step. Rebuilding here
  # would duplicate that work. Locally, the build is still needed so the
  # test command has something to run against.
  if [[ "${CI:-}" == "true" ]]; then
    echo "Skipping build (CI=true)"
  else
    echo "Building the project..."
    if ! pnpm build; then
      echo "Build process failed."
      return 1
    fi
  fi

  # Run tests with Jest
  echo "Running tests..."
  export NODE_OPTIONS="--experimental-vm-modules --trace-uncaught --stack-trace-limit=1000"
  if ! vitest "${VITEST_OPTIONS[@]}" "$@"; then
    echo "Test execution failed."
    return 1
  fi
}
echo "Running tests..."
test_project "$@"