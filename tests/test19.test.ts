import { Heartbeat } from '../src/system/heartbeat';
import { getConsumer, getRedisInstance, untilConsumerIdle } from './common';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../src/system/redis-keys';

describe('Consumer heartbeat: check online/offline consumers', () => {
  test('Case 1', async () => {
    const redisClient = await getRedisInstance();
    const HeartbeatAsync = promisifyAll(Heartbeat);
    const consumer = promisifyAll(getConsumer());
    await consumer.runAsync();
    await untilConsumerIdle(consumer);

    const consumersByOnlineStatus =
      await HeartbeatAsync.getHeartbeatsByStatusAsync(redisClient);

    expect(consumersByOnlineStatus.expired.length).toBe(0);
    expect(consumersByOnlineStatus.valid.length).toBe(1);
    expect(
      (redisKeys.extractData(consumersByOnlineStatus.valid[0]) ?? {})
        .consumerId,
    ).toBe(consumer.getId());

    await consumer.shutdownAsync();

    const res = await HeartbeatAsync.getHeartbeatsByStatusAsync(redisClient);
    expect(res.valid.length).toBe(0);
    expect(res.expired.length).toBe(0);
  });
});
