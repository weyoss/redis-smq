import { promisifyAll } from 'bluebird';
import { Consumer } from '../..';
import { defaultQueue, getQueueManager, getRedisInstance } from '../common';
import { consumerQueues } from '../../src/lib/consumer/consumer-queues';

test('Consume messages from different queues using a single consumer instance: case 3', async () => {
  const qm = await getQueueManager();
  await qm.queue.createAsync(defaultQueue, false);

  const consumer = promisifyAll(new Consumer());
  await consumer.runAsync();

  const redisClient = await getRedisInstance();
  const consumerQueuesAsync = promisifyAll(consumerQueues);

  const a = await consumerQueuesAsync.getConsumerQueuesAsync(
    redisClient,
    consumer.getId(),
  );
  expect(a).toEqual([]);

  const a1 = await consumerQueuesAsync.getQueueConsumersAsync(
    redisClient,
    defaultQueue,
    true,
  );
  expect(Object.keys(a1)).toEqual([]);

  const a2 = await consumerQueuesAsync.getQueueConsumersAsync(
    redisClient,
    defaultQueue,
    false,
  );
  expect(Object.keys(a2)).toEqual([]);

  await consumer.consumeAsync(defaultQueue, (msg, cb) => cb());

  const b = await consumerQueuesAsync.getConsumerQueuesAsync(
    redisClient,
    consumer.getId(),
  );
  expect(b).toEqual([defaultQueue]);

  const b1 = await consumerQueuesAsync.getQueueConsumersAsync(
    redisClient,
    defaultQueue,
    true,
  );
  expect(Object.keys(b1)).toEqual([consumer.getId()]);

  const b2 = await consumerQueuesAsync.getQueueConsumersAsync(
    redisClient,
    defaultQueue,
    false,
  );
  expect(Object.keys(b2)).toEqual([consumer.getId()]);

  await consumer.cancelAsync(defaultQueue);

  const c = await consumerQueuesAsync.getConsumerQueuesAsync(
    redisClient,
    consumer.getId(),
  );
  expect(c).toEqual([]);

  const c1 = await consumerQueuesAsync.getQueueConsumersAsync(
    redisClient,
    defaultQueue,
    true,
  );
  expect(Object.keys(c1)).toEqual([]);

  await consumer.shutdownAsync();
});
