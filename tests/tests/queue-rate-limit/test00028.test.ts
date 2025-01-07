/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from '@jest/globals';
import {
  QueueQueueNotFoundError,
  QueueRateLimitInvalidIntervalError,
  QueueRateLimitInvalidLimitError,
} from '../../../src/lib/index.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueueRateLimit } from '../../common/queue-rate-limit.js';

test('SetQueueRateLimit()/GetQueueRateLimit()/ClearQueueRateLimit()', async () => {
  const queueRateLimit = await getQueueRateLimit();
  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 5,
      interval: 1000,
    }),
  ).rejects.toThrow(QueueQueueNotFoundError);

  await createQueue(defaultQueue, false);
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 5,
    interval: 1000,
  });

  const rateLimit = await queueRateLimit.getAsync(defaultQueue);
  expect(rateLimit).toEqual({ limit: 5, interval: 1000 });

  await queueRateLimit.clearAsync(defaultQueue);

  const rateLimit2 = await queueRateLimit.getAsync(defaultQueue);
  expect(rateLimit2).toEqual(null);

  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 0,
      interval: 1000,
    }),
  ).rejects.toThrow(QueueRateLimitInvalidLimitError);

  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 4,
      interval: 0,
    }),
  ).rejects.toThrow(QueueRateLimitInvalidIntervalError);
});
