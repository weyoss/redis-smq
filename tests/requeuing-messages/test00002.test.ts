import {
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test. Requeue message from acknowledged queue. Check both pending and acknowledged messages. Check queue metrics.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceMessageAsync(msg);
  const { ns, name } = producer.getQueue();

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      cb();
    },
  });
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const res1 = await messageManager.getPendingMessagesAsync(name, ns, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(
    name,
    ns,
    0,
    100,
  );
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(name, ns);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(1);

  await messageManager.requeueMessageFromAcknowledgedQueueAsync(
    name,
    ns,
    0,
    msg.getId(),
    false,
    undefined,
  );

  const res5 = await messageManager.getPendingMessagesAsync(name, ns, 0, 100);

  expect(res5.total).toBe(1);
  expect(res5.items.length).toBe(1);
  expect(res5.items[0].message.getId()).toEqual(msg.getId());

  const res6 = await messageManager.getAcknowledgedMessagesAsync(
    name,
    ns,
    0,
    100,
  );
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(queueMetrics1.acknowledged).toBe(0);
  expect(queueMetrics1.pending).toBe(1);

  await expect(async () => {
    await messageManager.requeueMessageFromAcknowledgedQueueAsync(
      name,
      ns,
      0,
      msg.getId(),
      false,
      undefined,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
