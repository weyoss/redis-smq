/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { main } from './domains/main.js';
import { exchange } from './domains/exchange.js';
import { queue } from './domains/queue.js';
import { namespace } from './domains/namespace.js';

export const redisKeys = {
  ...namespace,
  ...queue,
  ...exchange,
  ...main,
};
