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

test('Combined test: Delete an acknowledged message. Check pending, acknowledged, and dead-letter messages. Check both message metadata and queue metadata.', async () => {
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

  const messageManager = promisifyAll(await getMessageManager());

  const res0 = await messageManager.getDeadLetterMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res0.total).toBe(0);
  expect(res0.items.length).toBe(0);

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
  // assign default consumer options
  const msg1 = Message.createFromMessage(msg)
    .setTTL(0)
    .setRetryThreshold(3)
    .setRetryDelay(0)
    .setConsumeTimeout(0);
  expect(res2.items[0]).toEqual(msg1);

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetadata1 = await queueManager.getQueueMetadataAsync(
    producer.getQueueName(),
  );
  expect(queueMetadata1.pending).toBe(0);
  expect(queueMetadata1.acknowledged).toBe(1);

  await messageManager.deleteAcknowledgedMessageAsync(
    producer.getQueueName(),
    msg.getId(),
  );

  const res3 = await messageManager.getAcknowledgedMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res3.total).toBe(0);
  expect(res3.items.length).toBe(0);

  const res4 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res4.total).toBe(0);
  expect(res4.items.length).toBe(0);

  const res5 = await messageManager.getPendingMessagesWithPriorityAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res5.total).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await messageManager.getDeadLetterMessagesAsync(
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

  const msgMeta = await messageManager.getMessageMetadataListAsync(msg.getId());
  expect(msgMeta.length).toBe(3);

  expect(msgMeta[0].type).toBe(EMessageMetadata.ENQUEUED);
  expect(msgMeta[0].state).toEqual(msg);

  expect(msgMeta[1].type).toBe(EMessageMetadata.ACKNOWLEDGED);
  expect(msgMeta[1].state).toEqual(msg1);

  expect(msgMeta[2].type).toBe(
    EMessageMetadata.DELETED_FROM_ACKNOWLEDGED_QUEUE,
  );
  expect(msgMeta[2].state).toEqual(msg1);

  await expect(async () => {
    await messageManager.deleteAcknowledgedMessageAsync(
      producer.getQueueName(),
      msg.getId(),
    );
  }).rejects.toThrow(
    'Unexpected metadata type [deleted_from_acknowledged_queue]. Expected ["acknowledged"]',
  );

  await expect(async () => {
    await messageManager.deleteAcknowledgedMessageAsync(
      producer.getQueueName(),
      new Message().getId(),
    );
  }).rejects.toThrow('Message does not exist');
});
