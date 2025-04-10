/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'path';
import { env } from '../env/index.js';

export const REDIS_SERVER_VERSION = '7.2.8';
export const REDIS_CACHE_DIRECTORY = path.join(
  env.getCacheDir(),
  'redis-smq-common',
);
export const REDIS_SETUP_LOCK_FILE = path.join(
  REDIS_CACHE_DIRECTORY,
  'redis-server-setup.lock',
);
export const REDIS_BINARY_PATH = path.join(
  REDIS_CACHE_DIRECTORY,
  'redis-server',
);
