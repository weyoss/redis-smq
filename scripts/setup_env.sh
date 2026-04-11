#!/bin/bash

#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

# Check if the source file exists in the home directory
if [ ! -f "$HOME/.env.sh" ];  then
  error "Please create an .env.sh file in the home directory: ~/.env.sh"
fi

# Init the environment setup
. "$HOME/.env.sh"