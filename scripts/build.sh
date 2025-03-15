#!/bin/bash

#
# Copyright (c)
# Weyoss <weyoss@protonmail.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

clean_root_directory() {
  echo "Cleaning root directory..."
  rm -rf node_modules && rm pnpm-lock.yaml
}

clean_workspaces() {
  echo "Cleaning all workspaces..."
  pnpm -r exec rm -rf node_modules
}

install_dependencies() {
  echo "Installing dependencies..."
  pnpm install
}

# Handles the build process with optional cleaning
build_project() {
  local clean_mode="$1"

  case "$clean_mode" in
    "all")
      clean_root_directory
      clean_workspaces
      install_dependencies
      ;;
    "workspaces")
      clean_workspaces
      install_dependencies
      ;;
    "none")
      echo "No node_module cleaning performed."
      ;;
    *)
      echo "Invalid argument. Please use 'all', 'workspaces', or 'none'."
      return 1
      ;;
  esac

  echo "Cleaning up all workspaces dist..."
  pnpm -r exec rm -rf dist

  echo "Executing the build process across all workspaces..."
  pnpm -r build
}

build_project "$1"
