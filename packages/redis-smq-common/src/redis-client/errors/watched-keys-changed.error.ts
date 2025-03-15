/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisClientError } from './redis-client.error.js';

export class WatchedKeysChangedError extends RedisClientError {
  constructor(msg = 'One (or more) of the watched keys has been changed') {
    super(msg);
  }
}
