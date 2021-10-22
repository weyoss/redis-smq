import {
  getConsumer,
  getMessageManager,
  getProducer,
  getRedisInstance,
} from './common';
import { Message } from '../src/message';
import { EMessageMetadata, IMessageMetadata } from '../types';
import { promisifyAll } from 'bluebird';
import { metadata } from '../src/system/metadata';

test('Combined test: delete a scheduled message and check message metadata ', async () => {
  const message = new Message();
  message.setScheduledDelay(10000);

  const producer = getProducer();
  await producer.produceMessageAsync(message);

  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb();
    }),
  });
  await consumer.runAsync();
  const messageManager = promisifyAll(await getMessageManager());

  await messageManager.deleteScheduledMessageAsync(
    consumer.getQueueName(),
    message.getId(),
  );

  const client = await getRedisInstance();
  const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
    metadata.getMessageMetadataList(client, message.getId(), (err, data) => {
      if (err) reject(err);
      else resolve(data ?? []);
    });
  });

  expect(m.length).toBe(2);
  expect(m[0].type).toBe(EMessageMetadata.SCHEDULED);
  expect(m[1].type).toBe(EMessageMetadata.DELETED_FROM_SCHEDULED_QUEUE);
});
