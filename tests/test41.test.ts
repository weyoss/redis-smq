import {
  getConsumer,
  getProducer,
  getRedisInstance,
  untilConsumerIdle,
} from './common';
import { Message } from '../src/message';
import {
  EMessageDeadLetterCause,
  EMessageMetadata,
  EMessageUnacknowledgedCause,
  IMessageMetadata,
} from '../types';
import { delay } from 'bluebird';
import { metadata } from '../src/system/metadata';

test('Combined test: produce and unacknowledge a message with expired TTL and check its metadata', async () => {
  const client = await getRedisInstance();
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn(() => {
      throw new Error('Not expected');
    }),
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  msg.setTTL(1000);
  await producer.produceMessageAsync(msg);

  await delay(2000);

  await consumer.runAsync();
  await untilConsumerIdle(consumer);

  const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
    metadata.getMessageMetadataList(client, msg.getId(), (err, data) => {
      if (err) reject(err);
      else resolve(data ?? []);
    });
  });

  expect(m.length).toBe(3);
  expect(m[0].type).toBe(EMessageMetadata.ENQUEUED);
  expect(m[1].type).toBe(EMessageMetadata.UNACKNOWLEDGED);
  expect(m[1].unacknowledgedCause).toBe(
    EMessageUnacknowledgedCause.TTL_EXPIRED,
  );
  expect(m[2].type).toBe(EMessageMetadata.DEAD_LETTER);
  expect(m[2].deadLetterCause).toBe(EMessageDeadLetterCause.TTL_EXPIRED);
});
