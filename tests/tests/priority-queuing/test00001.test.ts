/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { defaultQueue } from '../../common/message-producing-consuming';
import { EQueueDeliveryModel, EQueueType } from '../../../types';
import { getQueue } from '../../common/queue';

test('Priority queuing: case 1', async () => {
  const queue = await getQueue();
  await queue.saveAsync(
    defaultQueue,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = promisifyAll(getConsumer({ queue: defaultQueue }));
  await consumer.runAsync();
});
