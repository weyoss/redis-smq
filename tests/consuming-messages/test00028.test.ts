import { defaultQueue, getQueueManagerFrontend } from '../common';
import { promisifyAll } from 'bluebird';

test('SetQueueRateLimit()/GetQueueRateLimit()/ClearQueueRateLimit()', async () => {
  const qm = promisifyAll(await getQueueManagerFrontend());
  await qm.setQueueRateLimitAsync(defaultQueue, { limit: 5, interval: 1000 });

  const rateLimit = await qm.getQueueRateLimitAsync(defaultQueue);
  expect(rateLimit).toEqual({ limit: 5, interval: 1000 });

  qm.clearQueueRateLimitAsync(defaultQueue);

  const rateLimit2 = await qm.getQueueRateLimitAsync(defaultQueue);
  expect(rateLimit2).toEqual(null);

  await expect(async () => {
    await qm.setQueueRateLimitAsync(defaultQueue, { limit: 0, interval: 1000 });
  }).rejects.toThrow(
    `Invalid rateLimit.limit. Expected a positive integer > 0`,
  );

  await expect(async () => {
    await qm.setQueueRateLimitAsync(defaultQueue, { limit: 4, interval: 0 });
  }).rejects.toThrow(
    `Invalid rateLimit.interval. Expected a positive integer >= 1000`,
  );
});
