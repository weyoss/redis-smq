/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { defaultQueue } from '../../common/message-producing-consuming';
import { getQueueRateLimit } from '../../common/queue-rate-limit';

test('SetQueueRateLimit()/GetQueueRateLimit()/ClearQueueRateLimit()', async () => {
  const queueRateLimit = await getQueueRateLimit();
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 5,
    interval: 1000,
  });

  const rateLimit = await queueRateLimit.getAsync(defaultQueue);
  expect(rateLimit).toEqual({ limit: 5, interval: 1000 });

  await queueRateLimit.clearAsync(defaultQueue);

  const rateLimit2 = await queueRateLimit.getAsync(defaultQueue);
  expect(rateLimit2).toEqual(null);

  await expect(async () => {
    await queueRateLimit.setAsync(defaultQueue, {
      limit: 0,
      interval: 1000,
    });
  }).rejects.toThrow(
    `Invalid rateLimit.limit. Expected a positive integer > 0`,
  );

  await expect(async () => {
    await queueRateLimit.setAsync(defaultQueue, {
      limit: 4,
      interval: 0,
    });
  }).rejects.toThrow(
    `Invalid rateLimit.interval. Expected a positive integer >= 1000`,
  );
});
