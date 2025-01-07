/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import bluebird from 'bluebird';
import { resolve } from 'path';
import { getDirname, ICallback, IRedisClient } from 'redis-smq-common';
import { IQueueParams } from '../../../src/lib/index.js';
import { defaultQueue } from '../../common/message-producing-consuming.js';
import { mockModule } from '../../common/mock-module.js';

const dir = getDirname();

test('SetQueueRateLimit(): QueueRateLimitQueueNotFoundError', async () => {
  const modulePath = resolve(
    dir,
    '../../../src/lib/queue/_/_parse-queue-params-and-validate.js',
  );
  mockModule(modulePath, () => {
    return {
      _parseQueueParamsAndValidate(
        redisClient: IRedisClient,
        queue: string | IQueueParams,
        cb: ICallback<IQueueParams>,
      ) {
        cb(null, defaultQueue);
      },
    };
  });
  const { QueueRateLimit } = await import(
    '../../../src/lib/queue-rate-limit/queue-rate-limit.js'
  );
  const { QueueRateLimitQueueNotFoundError } = await import(
    '../../../src/lib/queue-rate-limit/errors/queue-rate-limit-queue-not-found.error.js'
  );
  const queueRateLimit = bluebird.promisifyAll(new QueueRateLimit());
  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 5,
      interval: 1000,
    }),
  ).rejects.toThrow(QueueRateLimitQueueNotFoundError);
  await queueRateLimit.shutdownAsync();
});
