import {
  getConsumer,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerEvent,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { events } from '../../src/system/common/events';

test('Deleting a message queue with all of its data', async () => {
  const producer = promisifyAll(getProducer());
  const consumer = promisifyAll(getConsumer());
  consumer.consume = (msg, cb) => {
    setTimeout(cb, 5000);
  };
  await consumer.runAsync();

  const msg = new Message().setBody({ hello: 'world' });
  await producer.produceAsync(msg);
  await untilConsumerEvent(consumer, events.MESSAGE_ACKNOWLEDGED);

  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m1 = await queueManager.getQueueMetricsAsync(producer.getQueue());
  expect(m1.acknowledged).toBe(1);

  await expect(async () => {
    await queueManager.deleteMessageQueueAsync(producer.getQueue());
  }).rejects.toThrow(
    'The queue is currently in use. Before deleting a queue, shutdown all its consumers and producers.',
  );

  await producer.shutdownAsync();

  await expect(async () => {
    await queueManager.deleteMessageQueueAsync(producer.getQueue());
  }).rejects.toThrow(
    'The queue is currently in use. Before deleting a queue, shutdown all its consumers and producers.',
  );

  await consumer.shutdownAsync();
  await queueManager.deleteMessageQueueAsync(producer.getQueue());

  const m2 = await queueManager.getQueueMetricsAsync(producer.getQueue());
  expect(m2.acknowledged).toBe(0);

  await expect(async () => {
    await queueManager.deleteMessageQueueAsync(producer.getQueue());
  }).rejects.toThrow('Queue does not exist');
});
