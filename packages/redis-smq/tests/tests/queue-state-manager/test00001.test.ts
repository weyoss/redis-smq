/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import {
  Consumer,
  EQueueOperationalState,
  EQueueStateTransitionReason,
  EQueueType,
  QueueManager,
  QueueStateManager,
} from '../../../src/index.js';
import bluebird from 'bluebird';
import { QueueOperationForbiddenError } from '../../../src/errors/index.js';

test('QueueStateManger: pause()', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const queueManager = bluebird.promisifyAll(new QueueManager());
  const props1 = await queueManager.getPropertiesAsync(defaultQueue);
  expect(props1.operationalState).toEqual(EQueueOperationalState.ACTIVE);

  const stateManager = bluebird.promisifyAll(new QueueStateManager());
  await stateManager.pauseAsync(defaultQueue, {
    reason: EQueueStateTransitionReason.SCHEDULED,
    description: 'Planned deployment',
  });

  const props2 = await queueManager.getPropertiesAsync(defaultQueue);
  expect(props2.operationalState).toEqual(EQueueOperationalState.PAUSED);

  const history = await stateManager.getStateHistoryAsync(defaultQueue);
  expect(history.length).toEqual(2);

  expect(history[0].from).toEqual(EQueueOperationalState.ACTIVE);
  expect(history[0].to).toEqual(EQueueOperationalState.PAUSED);

  expect(history[1].from).toEqual(null);
  expect(history[1].to).toEqual(EQueueOperationalState.ACTIVE);

  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.runAsync();
  await expect(
    consumer.consumeAsync(defaultQueue, (msg, done) => done()),
  ).rejects.toThrow(QueueOperationForbiddenError);

  await consumer.shutdownAsync();
});
