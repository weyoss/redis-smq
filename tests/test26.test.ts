import { getMessageManager, getProducer, getQueueManager } from './common';
import { Message } from '../src/message';
import { promisifyAll } from 'bluebird';
import { EMessageMetadata } from '../types';

test('Combined test: Delete a pending message. Check pending messages. Check both message metadata and queue metadata.', async () => {
  const producer = getProducer();

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );

  expect(res1.total).toBe(1);
  expect(res1.items[0].getId()).toBe(msg.getId());

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetadata1 = await queueManager.getQueueMetadataAsync(
    producer.getQueueName(),
  );
  expect(queueMetadata1.pending).toBe(1);

  await messageManager.deletePendingMessageAsync(
    producer.getQueueName(),
    msg.getId(),
  );

  const res2 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );

  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetadata2 = await queueManager.getQueueMetadataAsync(
    producer.getQueueName(),
  );
  expect(queueMetadata2.pending).toBe(0);

  const msgMeta = await messageManager.getMessageMetadataListAsync(msg.getId());
  expect(msgMeta.length).toBe(2);

  expect(msgMeta[0].type).toBe(EMessageMetadata.ENQUEUED);
  expect(msgMeta[0].state).toEqual(msg);

  expect(msgMeta[1].type).toBe(EMessageMetadata.DELETED_FROM_QUEUE);
  expect(msgMeta[1].state).toEqual(msg);

  await expect(async () => {
    await messageManager.deletePendingMessageAsync(
      producer.getQueueName(),
      msg.getId(),
    );
  }).rejects.toThrow(
    'Unexpected metadata type [deleted_from_queue]. Expected ["enqueued","enqueued_with_priority"]',
  );

  await expect(async () => {
    await messageManager.deletePendingMessageAsync(
      producer.getQueueName(),
      new Message().getId(),
    );
  }).rejects.toThrow('Message does not exist');
});
