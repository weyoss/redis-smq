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
import { metadata } from '../src/system/metadata';

test('Combined test: produce and unacknowledge a message until retry threshold is exceeded and check message metadata', async () => {
  const client = await getRedisInstance();
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  consumer.run();
  await untilConsumerIdle(consumer);

  const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
    metadata.getMessageMetadataList(client, msg.getId(), (err, data) => {
      if (err) reject(err);
      else resolve(data ?? []);
    });
  });
  expect(m.length).toBe(9);
  expect(m[0].type).toBe(EMessageMetadata.ENQUEUED);
  expect(m[1].type).toBe(EMessageMetadata.UNACKNOWLEDGED);
  expect(m[1].unacknowledgedCause).toBe(
    EMessageUnacknowledgedCause.CAUGHT_ERROR,
  );
  expect(m[2].type).toBe(EMessageMetadata.ENQUEUED);
  expect(m[3].type).toBe(EMessageMetadata.UNACKNOWLEDGED);
  expect(m[3].unacknowledgedCause).toBe(
    EMessageUnacknowledgedCause.CAUGHT_ERROR,
  );
  expect(m[4].type).toBe(EMessageMetadata.ENQUEUED);
  expect(m[5].type).toBe(EMessageMetadata.UNACKNOWLEDGED);
  expect(m[5].unacknowledgedCause).toBe(
    EMessageUnacknowledgedCause.CAUGHT_ERROR,
  );
  expect(m[6].type).toBe(EMessageMetadata.ENQUEUED);
  expect(m[7].type).toBe(EMessageMetadata.UNACKNOWLEDGED);
  expect(m[7].unacknowledgedCause).toBe(
    EMessageUnacknowledgedCause.CAUGHT_ERROR,
  );
  expect(m[8].type).toBe(EMessageMetadata.DEAD_LETTER);
  expect(m[8].deadLetterCause).toBe(
    EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
  );
});
