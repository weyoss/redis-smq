/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { resolve } from 'path';
import { expect, test, vitest } from 'vitest';
import bluebird from 'bluebird';
import { env, ICallback, IRedisClient } from 'redis-smq-common';
import {
  IQueueParams,
  QueueRateLimit,
  QueueRateLimitQueueNotFoundError,
} from '../../../src/lib/index.js';
import { getDefaultQueue } from '../../common/message-producing-consuming.js';

test('SetQueueRateLimit(): QueueRateLimitQueueNotFoundError', async () => {
  const defaultQueue = getDefaultQueue();
  const path1 = resolve(
    env.getCurrentDir(),
    '../../../src/lib/queue-rate-limit/queue-rate-limit.js',
  );
  const path2 = resolve(
    env.getCurrentDir(),
    '../../../src/lib/queue/_/_parse-queue-params-and-validate.js',
  );
  const { QueueRateLimit } = await esmock<{
    QueueRateLimit: new () => QueueRateLimit;
  }>(path1, {
    [path2]: {
      _parseQueueParamsAndValidate: vitest.fn(
        (
          redisClient: IRedisClient,
          queue: string | IQueueParams,
          cb: ICallback<IQueueParams>,
        ) => {
          cb(null, defaultQueue);
        },
      ),
    },
  });

  const queueRateLimit = bluebird.promisifyAll(new QueueRateLimit());
  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 5,
      interval: 1000,
    }),
  ).rejects.toThrow(QueueRateLimitQueueNotFoundError);
  await queueRateLimit.shutdownAsync();
});
