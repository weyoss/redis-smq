/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test } from 'vitest';
import bluebird from 'bluebird';
import { EQueueDeliveryModel, EQueueType } from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getDefaultQueue } from '../../common/message-producing-consuming.js';
import { getQueue } from '../../common/queue.js';

test('Priority queuing: case 1', async () => {
  const defaultQueue = getDefaultQueue();
  const queue = await getQueue();
  await queue.saveAsync(
    defaultQueue,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = bluebird.promisifyAll(getConsumer({ queue: defaultQueue }));
  await consumer.runAsync();
});
