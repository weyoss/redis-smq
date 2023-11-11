import { promisifyAll } from 'bluebird';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { shutDownBaseInstance } from '../../common/base-instance';
import { EQueueType } from '../../../types';
import { getQueue } from '../../common/queue';

test('Consume message from different queues using a single consumer instance: case 1', async () => {
  const queueInstance = await getQueue();
  const consumer = promisifyAll(new Consumer());

  expect(consumer.getQueues()).toEqual([]);

  await queueInstance.saveAsync('test_queue', EQueueType.LIFO_QUEUE);
  await consumer.consumeAsync('test_queue', (msg, cb) => cb());

  await queueInstance.saveAsync('another_queue', EQueueType.LIFO_QUEUE);
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

  await queueInstance.saveAsync('queue_a', EQueueType.PRIORITY_QUEUE);
  await consumer.consumeAsync('queue_a', (msg, cb) => cb());

  expect(consumer.consumeAsync('queue_a', (msg, cb) => cb())).rejects.toThrow(
    `A message handler for queue [queue_a@testing] already exists`,
  );

  expect(consumer.getQueues()).toEqual([
    { name: 'test_queue', ns: 'testing' },
    { name: 'another_queue', ns: 'testing' },
    { name: 'queue_a', ns: 'testing' },
  ]);

  await shutDownBaseInstance(consumer);
});
