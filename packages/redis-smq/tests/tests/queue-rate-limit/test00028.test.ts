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
  InvalidRateLimitValueError,
  InvalidRateLimitIntervalError,
  QueueNotFoundError,
} from '../../../src/errors/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueueRateLimit } from '../../common/queue-rate-limit.js';

test('SetQueueRateLimit()/GetQueueRateLimit()/ClearQueueRateLimit()', async () => {
  const defaultQueue = getDefaultQueue();
  const queueRateLimit = await getQueueRateLimit();
  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 5,
      interval: 1000,
    }),
  ).rejects.toThrow(QueueNotFoundError);

  await createQueue(defaultQueue, false);
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 5,
    interval: 1000,
  });

  const rateLimit = await queueRateLimit.getAsync(getDefaultQueue());
  expect(rateLimit).toEqual({ limit: 5, interval: 1000 });

  await queueRateLimit.clearAsync(getDefaultQueue());

  const rateLimit2 = await queueRateLimit.getAsync(getDefaultQueue());
  expect(rateLimit2).toEqual(null);

  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 0,
      interval: 1000,
    }),
  ).rejects.toThrow(InvalidRateLimitValueError);

  await expect(
    queueRateLimit.setAsync(defaultQueue, {
      limit: 4,
      interval: 0,
    }),
  ).rejects.toThrow(InvalidRateLimitIntervalError);
});
