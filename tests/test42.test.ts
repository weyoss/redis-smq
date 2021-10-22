import {
  getConsumer,
  getProducer,
  getRedisInstance,
  untilMessageAcknowledged,
} from './common';
import { Message } from '../src/message';
import { EMessageMetadata, IMessageMetadata } from '../types';
import { metadata } from '../src/system/metadata';

test('Combined test: schedule and consume a message and check its metadata', async () => {
  const message = new Message();
  message.setScheduledDelay(10000);

  const producer = getProducer();
  await producer.produceMessageAsync(message);

  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb();
    }),
  });
  consumer.run();
  await untilMessageAcknowledged(consumer);

  const client = await getRedisInstance();
  const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
    metadata.getMessageMetadataList(client, message.getId(), (err, data) => {
      if (err) reject(err);
      else resolve(data ?? []);
    });
  });

  expect(m.length).toBe(3);
  expect(m[0].type).toBe(EMessageMetadata.SCHEDULED);
  expect(m[1].type).toBe(EMessageMetadata.ENQUEUED);
  expect(m[2].type).toBe(EMessageMetadata.ACKNOWLEDGED);
});
