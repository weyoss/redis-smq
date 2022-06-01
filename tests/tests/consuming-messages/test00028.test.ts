import { getQueueManager } from '../../common/queue-manager';
import { defaultQueue } from '../../common/message-producing-consuming';

test('SetQueueRateLimit()/GetQueueRateLimit()/ClearQueueRateLimit()', async () => {
  const qm = await getQueueManager();
  await qm.queueRateLimit.setAsync(defaultQueue, {
    limit: 5,
    interval: 1000,
  });

  const rateLimit = await qm.queueRateLimit.getAsync(defaultQueue);
  expect(rateLimit).toEqual({ limit: 5, interval: 1000 });

  qm.queueRateLimit.clearAsync(defaultQueue);

  const rateLimit2 = await qm.queueRateLimit.getAsync(defaultQueue);
  expect(rateLimit2).toEqual(null);

  await expect(async () => {
    await qm.queueRateLimit.setAsync(defaultQueue, {
      limit: 0,
      interval: 1000,
    });
  }).rejects.toThrow(
    `Invalid rateLimit.limit. Expected a positive integer > 0`,
  );

  await expect(async () => {
    await qm.queueRateLimit.setAsync(defaultQueue, {
      limit: 4,
      interval: 0,
    });
  }).rejects.toThrow(
    `Invalid rateLimit.interval. Expected a positive integer >= 1000`,
  );
});
