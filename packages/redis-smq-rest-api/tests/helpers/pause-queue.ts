/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams, RedisSMQ } from 'redis-smq';

export async function pauseQueue(queue: IQueueParams) {
  const sm = RedisSMQ.createQueueStateManager();
  return sm.pause(queue, {});
}
