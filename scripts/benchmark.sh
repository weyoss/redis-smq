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

[ ! -d "misc/benchmarks" ] && exit 0
cd misc/benchmarks
sudo docker-compose down --remove-orphans
sudo docker-compose run -e TM=5000 benchmark-runner