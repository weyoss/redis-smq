import { getMessageManager, getProducer, getQueueManager } from './common';
import { Message } from '../src/message';
import { promisifyAll } from 'bluebird';
import { EMessageMetadata } from '../types';

test('Combined test: Delete a scheduled message. Check scheduled messages list. Check both queue metadata and message metadata', async () => {
  const producer = getProducer();

  const msg = new Message();
  msg.setScheduledCron('0 * * * * *').setBody({ hello: 'world1' });
  await producer.produceMessageAsync(msg);

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getScheduledMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res1.total).toBe(1);
  expect(res1.items.length).toBe(1);
  expect(res1.items[0]).toEqual(msg);

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetadata1 = await queueManager.getQueueMetadataAsync(
    producer.getQueueName(),
  );
  expect(queueMetadata1.pending).toBe(0);
  expect(queueMetadata1.acknowledged).toBe(0);
  expect(queueMetadata1.deadLetter).toBe(0);
  expect(queueMetadata1.scheduled).toBe(1);

  await messageManager.deleteScheduledMessageAsync(
    producer.getQueueName(),
    msg.getId(),
  );

  const res2 = await messageManager.getScheduledMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetadata2 = await queueManager.getQueueMetadataAsync(
    producer.getQueueName(),
  );
  expect(queueMetadata2.scheduled).toBe(0);

  const msgMeta = await messageManager.getMessageMetadataListAsync(msg.getId());
  expect(msgMeta.length).toBe(2);

  expect(msgMeta[1].type).toBe(EMessageMetadata.DELETED_FROM_SCHEDULED_QUEUE);
  expect(msgMeta[1].state).toEqual(msg);

  await expect(async () => {
    await messageManager.deleteScheduledMessageAsync(
      producer.getQueueName(),
      msg.getId(),
    );
  }).rejects.toThrow(
    'Unexpected metadata type [deleted_from_scheduled_queue]. Expected ["scheduled"]',
  );

  await expect(async () => {
    await messageManager.deleteScheduledMessageAsync(
      producer.getQueueName(),
      new Message().getId(),
    );
  }).rejects.toThrow('Message does not exist');
});
