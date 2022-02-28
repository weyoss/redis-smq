import { promisifyAll } from 'bluebird';
import { Consumer } from '../../src/consumer';

test('Consume messages from different queues using a single consumer instance: case 1', async () => {
  const consumer = promisifyAll(new Consumer());

  expect(consumer.getQueues()).toEqual([]);

  const isRunning1 = await consumer.consumeAsync(
    'test_queue',
    false,
    (msg, cb) => cb(),
  );
  expect(isRunning1).toBe(false);

  const isRunning2 = await consumer.consumeAsync(
    'another_queue',
    false,
    (msg, cb) => cb(),
  );
  expect(isRunning2).toBe(false);

  expect(async () => {
    await consumer.consumeAsync('another_queue', true, (msg, cb) => cb());
  }).rejects.toThrow(
    `A message handler for queue [${JSON.stringify({
      name: 'another_queue',
      ns: 'testing',
    })}] already exists`,
  );

  expect(consumer.getQueues()).toEqual([
    {
      queue: { name: 'test_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
    {
      queue: { name: 'another_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
  ]);

  await expect(async () => {
    return new Promise<void>(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      consumer.cancel('another_queue', true);
    });
  }).rejects.toThrow('Invalid arguments provided');

  await new Promise<void>((resolve, reject) => {
    consumer.cancel('another_queue', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  expect(consumer.getQueues()).toEqual([
    {
      queue: { name: 'test_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
  ]);

  await consumer.consumeAsync('another_queue', false, (msg, cb) => cb());

  expect(consumer.getQueues()).toEqual([
    {
      queue: { name: 'test_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
    {
      queue: { name: 'another_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
  ]);

  const res = await consumer.runAsync();
  expect(res).toBe(true);

  expect(async () => {
    await consumer.consumeAsync('another_queue', false, (msg, cb) => cb());
  }).rejects.toThrow(
    `A message handler for queue [${JSON.stringify({
      name: 'another_queue',
      ns: 'testing',
    })}] already exists`,
  );

  await consumer.cancelAsync('another_queue', false);

  // does not throw an error
  await consumer.cancelAsync('another_queue', false);

  expect(consumer.getQueues()).toEqual([
    {
      queue: { name: 'test_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
  ]);

  await consumer.consumeAsync('another_queue', false, (msg, cb) => cb());

  expect(consumer.getQueues()).toEqual([
    {
      queue: { name: 'test_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
    {
      queue: { name: 'another_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
  ]);

  const isRunning3 = await consumer.consumeAsync('queue_a', false, (msg, cb) =>
    cb(),
  );
  expect(isRunning3).toBe(true);

  await expect(async () => {
    await consumer.consumeAsync('queue_a', true, (msg, cb) => cb());
  }).rejects.toThrow(
    `A message handler for queue [${JSON.stringify({
      name: 'queue_a',
      ns: 'testing',
    })}] already exists`,
  );

  expect(consumer.getQueues()).toEqual([
    {
      queue: { name: 'test_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
    {
      queue: { name: 'another_queue', ns: 'testing' },
      usingPriorityQueuing: false,
    },
    {
      queue: { name: 'queue_a', ns: 'testing' },
      usingPriorityQueuing: false,
    },
  ]);

  await consumer.shutdownAsync();
});
