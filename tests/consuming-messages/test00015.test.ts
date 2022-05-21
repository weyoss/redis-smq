import { promisifyAll } from 'bluebird';
import { Consumer } from '../..';
import { getQueueManager } from '../common';

test('Consume messages from different queues using a single consumer instance: case 1', async () => {
  const queueManager = await getQueueManager();
  const consumer = promisifyAll(new Consumer());

  expect(consumer.getQueues()).toEqual([]);

  await queueManager.queue.createAsync('test_queue', false);
  await consumer.consumeAsync('test_queue', (msg, cb) => cb());

  await queueManager.queue.createAsync('another_queue', false);
  await consumer.consumeAsync('another_queue', (msg, cb) => cb());

  expect(
    consumer.consumeAsync('another_queue', (msg, cb) => cb()),
  ).rejects.toThrow(
    `A message handler for queue [another_queue@testing] already exists`,
  );

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing' },
    { name: 'another_queue', ns: 'testing' },
  ]);

  await consumer.cancelAsync('another_queue');

  expect(consumer.getQueues()).toEqual([{ name: 'test_queue', ns: 'testing' }]);

  await consumer.consumeAsync('another_queue', (msg, cb) => cb());

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing' },
    { name: 'another_queue', ns: 'testing' },
  ]);

  const res = await consumer.runAsync();
  expect(res).toBe(true);

  expect(
    consumer.consumeAsync('another_queue', (msg, cb) => cb()),
  ).rejects.toThrow(
    `A message handler for queue [another_queue@testing] already exists`,
  );

  await consumer.cancelAsync('another_queue');

  // does not throw an error
  await consumer.cancelAsync('another_queue');

  expect(consumer.getQueues()).toEqual([{ name: 'test_queue', ns: 'testing' }]);

  await consumer.consumeAsync('another_queue', (msg, cb) => cb());

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing' },
    { name: 'another_queue', ns: 'testing' },
  ]);

  await queueManager.queue.createAsync('queue_a', true);
  await consumer.consumeAsync('queue_a', (msg, cb) => cb());

  expect(consumer.consumeAsync('queue_a', (msg, cb) => cb())).rejects.toThrow(
    `A message handler for queue [queue_a@testing] already exists`,
  );

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing' },
    { name: 'another_queue', ns: 'testing' },
    { name: 'queue_a', ns: 'testing' },
  ]);

  await consumer.shutdownAsync();
});
