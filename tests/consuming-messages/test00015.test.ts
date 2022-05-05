import { promisifyAll } from 'bluebird';
import { Consumer } from '../../src/consumer';

test('Consume messages from different queues using a single consumer instance: case 1', async () => {
  const consumer = promisifyAll(new Consumer());

  expect(consumer.getQueues()).toEqual([]);

  const isRunning1 = await consumer.consumeAsync('test_queue', (msg, cb) =>
    cb(),
  );
  expect(isRunning1).toBe(false);

  const isRunning2 = await consumer.consumeAsync('another_queue', (msg, cb) =>
    cb(),
  );
  expect(isRunning2).toBe(false);

  expect(async () => {
    await consumer.consumeAsync(
      {
        name: 'another_queue',
        priorityQueuing: true,
      },
      (msg, cb) => cb(),
    );
  }).rejects.toThrow(
    `A message handler for queue [another_queue@testing] already exists`,
  );

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing', priorityQueuing: false },
    { name: 'another_queue', ns: 'testing', priorityQueuing: false },
  ]);

  await consumer.cancelAsync('another_queue');

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing', priorityQueuing: false },
  ]);

  await consumer.consumeAsync('another_queue', (msg, cb) => cb());

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing', priorityQueuing: false },
    { name: 'another_queue', ns: 'testing', priorityQueuing: false },
  ]);

  const res = await consumer.runAsync();
  expect(res).toBe(true);

  expect(async () => {
    await consumer.consumeAsync('another_queue', (msg, cb) => cb());
  }).rejects.toThrow(
    `A message handler for queue [another_queue@testing] already exists`,
  );

  await consumer.cancelAsync('another_queue');

  // does not throw an error
  await consumer.cancelAsync('another_queue');

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing', priorityQueuing: false },
  ]);

  await consumer.consumeAsync('another_queue', (msg, cb) => cb());

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing', priorityQueuing: false },
    { name: 'another_queue', ns: 'testing', priorityQueuing: false },
  ]);

  const isRunning3 = await consumer.consumeAsync('queue_a', (msg, cb) => cb());
  expect(isRunning3).toBe(true);

  await expect(async () => {
    await consumer.consumeAsync(
      {
        name: 'queue_a',
        priorityQueuing: true,
      },
      (msg, cb) => cb(),
    );
  }).rejects.toThrow(
    `A message handler for queue [queue_a@testing] already exists`,
  );

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing', priorityQueuing: false },
    { name: 'another_queue', ns: 'testing', priorityQueuing: false },
    { name: 'queue_a', ns: 'testing', priorityQueuing: false },
  ]);

  await consumer.shutdownAsync();
});
