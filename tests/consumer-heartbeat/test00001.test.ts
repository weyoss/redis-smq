import { Heartbeat } from '../../src/system/common/heartbeat';
import { getConsumer, getRedisInstance, untilConsumerIdle } from '../common';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';

describe('Consumer heartbeat: check online/offline consumers', () => {
  test('Case 1', async () => {
    const redisClient = await getRedisInstance();
    const HeartbeatAsync = promisifyAll(Heartbeat);
    const consumer = promisifyAll(getConsumer());
    await consumer.runAsync();
    await untilConsumerIdle(consumer);

    //
    const validHeartbeatKeys = await HeartbeatAsync.getValidHeartbeatKeysAsync(
      redisClient,
    );
    expect(validHeartbeatKeys.length).toBe(1);
    const { consumerId: id1 } =
      redisKeys.extractData(validHeartbeatKeys[0]) ?? {};
    expect(id1).toBe(consumer.getId());

    //
    const validHeartbeats = await HeartbeatAsync.getValidHeartbeatsAsync(
      redisClient,
      false,
    );
    expect(validHeartbeats.length).toBe(1);
    const { consumerId: id2 } =
      redisKeys.extractData(validHeartbeats[0].key) ?? {};
    expect(id2).toBe(consumer.getId());

    //
    const expiredHeartbeatKeys =
      await HeartbeatAsync.getExpiredHeartbeatsKeysAsync(redisClient);
    expect(expiredHeartbeatKeys.length).toBe(0);

    await consumer.shutdownAsync();

    //
    const validHeartbeatKeys2 = await HeartbeatAsync.getValidHeartbeatKeysAsync(
      redisClient,
    );
    expect(validHeartbeatKeys2.length).toBe(0);

    //
    const validHeartbeats2 = await HeartbeatAsync.getValidHeartbeatsAsync(
      redisClient,
      false,
    );
    expect(validHeartbeats2.length).toBe(0);

    //
    const expiredHeartbeatKeys2 =
      await HeartbeatAsync.getExpiredHeartbeatsKeysAsync(redisClient);
    expect(expiredHeartbeatKeys2.length).toBe(0);
  });
});
