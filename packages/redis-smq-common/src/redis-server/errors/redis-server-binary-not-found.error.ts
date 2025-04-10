/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisServerError } from './redis-server.error.js';

export class RedisServerBinaryNotFoundError extends RedisServerError {
  constructor() {
    super(
      `A Redis server binary could not be found. Please set up Redis server first.`,
    );
  }
}
