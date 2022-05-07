import { promisifyAll } from 'bluebird';
import { Consumer } from '../../src/consumer';
import { getQueueManager } from '../common';

test('Consume messages from different queues using a single consumer instance: case 1', async () => {
  const queueManager = promisifyAll(await getQueueManager());
  const consumer = promisifyAll(new Consumer());

  expect(consumer.getQueues()).toEqual([]);

  await queueManager.createQueueAsync('test_queue', false);
  const isRunning1 = await consumer.consumeAsync('test_queue', (msg, cb) =>
    cb(),
  );
  expect(isRunning1).toBe(false);

  await queueManager.createQueueAsync('another_queue', false);
  const isRunning2 = await consumer.consumeAsync('another_queue', (msg, cb) =>
    cb(),
  );
  expect(isRunning2).toBe(false);

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

  await queueManager.createQueueAsync('queue_a', true);
  const isRunning3 = await consumer.consumeAsync('queue_a', (msg, cb) => cb());
  expect(isRunning3).toBe(true);

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
