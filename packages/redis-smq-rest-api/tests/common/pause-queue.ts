/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, QueueStateManager } from 'redis-smq';

const { promisifyAll } = bluebird;

export async function pauseQueue(queue: IQueueParams) {
  const sm = promisifyAll(new QueueStateManager());
  return sm.pauseAsync(queue, {});
}
