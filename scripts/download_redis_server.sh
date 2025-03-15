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

# Define the working directory
WORKING_DIR=$(realpath data)

# Define the version of Redis you want to install
REDIS_VERSION=stable

# Define the path to the redis-server binary
REDIS_BIN="$WORKING_DIR/redis-$REDIS_VERSION/src/redis-server"

# Define the path to the tarball
TARBALL="$WORKING_DIR/redis-$REDIS_VERSION.tar.gz"

# Check if the working directory exists, if not, create it
if [ ! -d "$WORKING_DIR" ]; then
  echo "Directory $WORKING_DIR does not exist. Creating it..."
  mkdir "$WORKING_DIR" || { echo "Failed to create directory $WORKING_DIR"; exit 1; }
fi

# Navigate to the working directory
cd "$WORKING_DIR" || { echo "Failed to change to directory $WORKING_DIR"; exit 1; }

# Check if the redis-server binary exists
if [ ! -f "$REDIS_BIN" ]; then
  echo "Redis binary not found. Building Redis..."

  # Check if the tarball file exists
  if [ ! -f "$TARBALL" ]; then
    echo "Tarball not found. Downloading Redis $REDIS_VERSION..."
    curl -O https://download.redis.io/redis-$REDIS_VERSION.tar.gz
  else
    echo "Tarball found. Skipping download."
  fi

  # Extract the tarball
  echo "Extracting Redis $REDIS_VERSION..."
  tar xzf redis-$REDIS_VERSION.tar.gz

  # Navigate to the Redis directory
  cd redis-$REDIS_VERSION

  # Compile Redis
  echo "Compiling Redis..."
  make
else
  echo "Redis binary found. Skipping build."
fi

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


