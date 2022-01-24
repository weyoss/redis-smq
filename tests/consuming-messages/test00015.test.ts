import { promisifyAll } from 'bluebird';
import { Consumer } from '../../src/consumer';
import { config } from '../config';

test('Multi queue consumer: case 1', async () => {
  const consumer = promisifyAll(new Consumer(config));

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
    await consumer.consumeAsync('another_queue', false, (msg, cb) => cb());
  }).rejects.toThrow(
    `Queue [${JSON.stringify({
      name: 'another_queue',
      ns: 'testing',
    })}] has already a message handler`,
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

  const res = await consumer.runAsync();
  expect(res).toBe(true);

  expect(async () => {
    await consumer.consumeAsync('another_queue', false, (msg, cb) => cb());
  }).rejects.toThrow(
    `Queue [${JSON.stringify({
      name: 'another_queue',
      ns: 'testing',
    })}] has already a message handler`,
  );

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

  const isRunning4 = await consumer.consumeAsync('queue_a', true, (msg, cb) =>
    cb(),
  );
  expect(isRunning4).toBe(true);

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
    {
      queue: { name: 'queue_a', ns: 'testing' },
      usingPriorityQueuing: true,
    },
  ]);

  await consumer.shutdownAsync();
});
