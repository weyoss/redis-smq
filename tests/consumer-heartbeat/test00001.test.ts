import { ConsumerHeartbeat } from '../../src/lib/consumer/consumer-heartbeat';
import {
  createQueue,
  defaultQueue,
  getConsumer,
  getRedisInstance,
} from '../common';
import { promisifyAll } from 'bluebird';

describe('Consumer heartbeat: check online/offline consumers', () => {
  test('Case 1', async () => {
    const redisClient = await getRedisInstance();
    const HeartbeatAsync = promisifyAll(ConsumerHeartbeat);
    await createQueue(defaultQueue, false);
    const consumer = getConsumer();
    await consumer.runAsync();

    //
    const validHeartbeatIds = await HeartbeatAsync.getValidHeartbeatIdsAsync(
      redisClient,
    );

    expect(validHeartbeatIds.length).toBe(1);
    expect(validHeartbeatIds[0]).toBe(consumer.getId());

    //
    const validHeartbeats = await HeartbeatAsync.getValidHeartbeatsAsync(
      redisClient,
    );
    expect(validHeartbeats.length).toBe(1);
    const { consumerId: id2 } = validHeartbeats[0] ?? {};
    expect(id2).toBe(consumer.getId());

    //
    const expiredHeartbeatKeys =
      await HeartbeatAsync.getExpiredHeartbeatIdsAsync(redisClient);
    expect(expiredHeartbeatKeys.length).toBe(0);

    await consumer.shutdownAsync();

    //
    const validHeartbeatKeys2 = await HeartbeatAsync.getValidHeartbeatIdsAsync(
      redisClient,
    );
    expect(validHeartbeatKeys2.length).toBe(0);

    //
    const validHeartbeats2 = await HeartbeatAsync.getValidHeartbeatsAsync(
      redisClient,
    );
    expect(validHeartbeats2.length).toBe(0);

    //
    const expiredHeartbeatKeys2 =
      await HeartbeatAsync.getExpiredHeartbeatIdsAsync(redisClient);
    expect(expiredHeartbeatKeys2.length).toBe(0);
  });
});
