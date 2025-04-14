#!/bin/bash

#
# Copyright (c)
# Weyoss <weyoss@protonmail.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

ensure_built() {
    echo "Ensuring redis-smq-common is built..."
    if ! pnpm -F redis-smq-common build; then
        echo "Error: Failed to build redis-smq-common"
        exit 1
    fi
}

handle_redis_command() {
    local command="$1"
    local cli_path="packages/redis-smq-common/dist/esm/bin/cli.js"

    # Ensure TypeScript is built before running commands
    ensure_built

    case "$command" in
        "start")
            node "$cli_path" redis --start-server
            ;;
        "download")
            node "$cli_path" redis --download-binary
            ;;
        "build")
            node "$cli_path" redis --build-from-source
            ;;
        *)
            echo "Error: Invalid command. Available commands are: start, download, build"
            echo "Usage: $0 <command>"
            echo "Examples:"
            echo "  $0 start     # Start Redis server"
            echo "  $0 download  # Download Redis binary"
            echo "  $0 build     # Build Redis from source"
            exit 1
            ;;
    esac
}

# Execute the command
handle_redis_command "$1"