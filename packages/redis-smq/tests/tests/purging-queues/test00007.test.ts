/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { env } from 'redis-smq-common';
import { Configuration, QueueManager } from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { ConsumerSetMismatchError } from '../../../src/errors/index.js';
import { resolve } from 'path';
import esmock from 'esmock';
import bluebird from 'bluebird';
import { RedisConnectionPool } from '../../../src/common/redis/redis-connection-pool/redis-connection-pool.js';

test('Concurrently deleting a message queue and starting a consumer', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  // Consuming defaultQueue
  const consumerA = getConsumer();
  await consumerA.run();

  // queueInstance.delete() calls processingQueue.getQueueProcessingQueues() after validation is passed.
  // Within getQueueProcessingQueues() method, we can take more time than usual to return a response, to allow the
  // consumer to start up. queueManagerInstance.delete() should detect that a consumer has been started and
  // the operation should be cancelled.
  const { _getProcessingQueues: originalMethod } =
    await import('../../../src/queue-manager/_/_get-processing-queues.js');
  const path1 = resolve(
    env.getCurrentDir(),
    '../../../src/queue-manager/queue-manager.js',
  );
  const path2 = resolve(
    env.getCurrentDir(),
    '../../../src/queue-manager/_/_get-processing-queues.js',
  );
  const path3 = resolve(
    env.getCurrentDir(),
    '../../../src/config/configuration.js',
  );
  const path4 = resolve(
    env.getCurrentDir(),
    '../../../src/common/redis/redis-connection-pool/redis-connection-pool.js',
  );
  const { QueueManager } = await esmock<{
    QueueManager: new () => QueueManager;
  }>(
    path1,
    {},
    {
      [path4]: {
        getInstance: () => {
          RedisConnectionPool.getInstance();
        },
      },
      [path3]: {
        getInstance: () => {
          Configuration.getInstance();
        },
      },
      [path2]: {
        _getProcessingQueues: (...args: Parameters<typeof originalMethod>) => {
          setTimeout(() => {
            originalMethod(...args);
          }, 5000);
        },
      },
    },
  );

  const q = bluebird.promisifyAll(new QueueManager());
  const consumerB = getConsumer();

  // instanceof returns false due to different contexts
  // await expect(
  //   Promise.all([q.delete(getDefaultQueue()), consumerB.run()]),
  // ).rejects.toThrow(ConsumerSetMismatchError);

  let error: unknown = null;
  try {
    await Promise.all([q.delete(getDefaultQueue()), consumerB.run()]);
  } catch (err) {
    error = err;
  }

  const errorName =
    error && typeof error === 'object' && 'name' in error ? error.name : null;

  expect(errorName).toEqual(ConsumerSetMismatchError.name);
});
