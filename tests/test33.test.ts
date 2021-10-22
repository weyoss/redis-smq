import {
  getConsumer,
  getMessageManager,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from './common';
import { Message } from '../src/message';
import { promisifyAll } from 'bluebird';
import { EMessageMetadata } from '../types';

test('Combined test. Requeue message from acknowledged queue. Check both pending and acknowledged messages. Check both message metadata and queue metadata.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceMessageAsync(msg);

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      cb();
    },
  });
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetadata1 = await queueManager.getQueueMetadataAsync(
    producer.getQueueName(),
  );
  expect(queueMetadata1.pending).toBe(0);
  expect(queueMetadata1.acknowledged).toBe(1);

  await messageManager.requeueMessageFromAcknowledgedQueueAsync(
    producer.getQueueName(),
    msg.getId(),
  );

  const res5 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );

  expect(res5.total).toBe(1);
  expect(res5.items.length).toBe(1);
  // assign default consumer options
  const msg2 = Message.createFromMessage(msg)
    .setTTL(0)
    .setRetryThreshold(3)
    .setRetryDelay(0)
    .setConsumeTimeout(0);
  expect(res5.items[0]).toEqual(msg2);

  const res6 = await messageManager.getAcknowledgedMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const queueMetadata2 = await queueManager.getQueueMetadataAsync(
    producer.getQueueName(),
  );
  expect(queueMetadata2.acknowledged).toBe(0);
  expect(queueMetadata2.pending).toBe(1);

  const msgMeta = await messageManager.getMessageMetadataListAsync(msg.getId());
  expect(msgMeta.length).toBe(4);

  expect(msgMeta[2].type).toBe(
    EMessageMetadata.DELETED_FROM_ACKNOWLEDGED_QUEUE,
  );
  expect(msgMeta[2].state).toEqual(msg2);

  expect(msgMeta[3].type).toBe(EMessageMetadata.ENQUEUED);
  expect(msgMeta[3].state).toEqual(msg2);

  await expect(async () => {
    await messageManager.requeueMessageFromAcknowledgedQueueAsync(
      producer.getQueueName(),
      msg.getId(),
    );
  }).rejects.toThrow(
    'Unexpected metadata type [enqueued]. Expected ["acknowledged"]',
  );

  await expect(async () => {
    await messageManager.requeueMessageFromAcknowledgedQueueAsync(
      producer.getQueueName(),
      new Message().getId(),
    );
  }).rejects.toThrow('Message does not exist');
});
