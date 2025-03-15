/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ConsumerGroups, IQueueParams } from 'redis-smq';

const { promisifyAll } = bluebird;

export async function saveConsumerGroup(
  queue: IQueueParams,
  consumerGroup: string,
) {
  const c = promisifyAll(new ConsumerGroups());
  await c.saveConsumerGroupAsync(queue, consumerGroup);
  await c.shutdownAsync();
  return consumerGroup;
}
