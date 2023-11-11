import { ConsumerHeartbeat } from '../../../src/lib/consumer/consumer-heartbeat';
import { promisifyAll } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { getRedisInstance } from '../../common/redis';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';

test('Consumer heartbeat: check online/offline consumers', async () => {
  const redisClient = await getRedisInstance();
  const HeartbeatAsync = promisifyAll(ConsumerHeartbeat);
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();
  await consumer.runAsync();

  //
  const consumersHeartbeats = await HeartbeatAsync.getConsumersHeartbeatsAsync(
    redisClient,
    [consumer.getId()],
  );
  expect(Object.keys(consumersHeartbeats).length).toBe(1);
  expect(consumersHeartbeats[consumer.getId()]).not.toBe(false);
  expect(Object.keys(consumersHeartbeats[consumer.getId()])).toEqual(
    expect.arrayContaining(['timestamp', 'data']),
  );

  //
  const expiredHeartbeatKeys = await HeartbeatAsync.getExpiredHeartbeatIdsAsync(
    redisClient,
    0,
    100,
  );
  expect(expiredHeartbeatKeys.length).toBe(0);

  await shutDownBaseInstance(consumer);

  //
  const validHeartbeatKeys2 = await HeartbeatAsync.getConsumersHeartbeatsAsync(
    redisClient,
    [consumer.getId()],
  );
  expect(Object.keys(validHeartbeatKeys2).length).toBe(1);
  expect(validHeartbeatKeys2[consumer.getId()]).toBe(false);

  //
  const expiredHeartbeatKeys2 =
    await HeartbeatAsync.getExpiredHeartbeatIdsAsync(redisClient, 0, 100);
  expect(expiredHeartbeatKeys2.length).toBe(0);
});
