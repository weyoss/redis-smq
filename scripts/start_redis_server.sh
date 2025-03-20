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

# Define the current scripts directory
SCRIPTS_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Define the working directory
WORKING_DIR="${SCRIPTS_DIR}/../data"

# Check if the working directory exists, if not, create it
if [ ! -d "$WORKING_DIR" ]; then
  echo "Directory $WORKING_DIR does not exist."
  exit 1;
fi

# Define the version of Redis you want to install
REDIS_VERSION=stable

# Check if a port is in use
is_port_in_use() {
  lsof -i :$1 > /dev/null 2>&1
  return $?
}

# Generate a random port number and check if it is available
PORT=0
while is_port_in_use $PORT; do
  PORT=$(( ( RANDOM % 64000 )  + 1024 ))
done

# Start the Redis server with both RDB and AOF persistence disabled.
# The --appendonly no option disables AOF, and the --save "" option disables RDB.
echo "Starting Redis server without persistency..."
cd "$WORKING_DIR/redis-$REDIS_VERSION/src"
./redis-server --appendonly no --save "" --port $PORT
