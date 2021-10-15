import {
  getConsumer,
  getProducer,
  getRedisInstance,
  getScheduler,
  untilConsumerIdle,
  untilMessageAcknowledged,
} from './common';
import { Message } from '../src/message';
import { Metadata } from '../src/system/metadata';
import {
  EMessageDeadLetterCause,
  EMessageMetadataType,
  EMessageUnacknowledgedCause,
  TMessageMetadata,
} from '../types';
import { delay, promisifyAll } from 'bluebird';

describe('Message Metadata: check that message metadata are valid', () => {
  test('Case 1', async () => {
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

    const metadata = await new Promise<TMessageMetadata[]>(
      (resolve, reject) => {
        Metadata.getMessageMetadata(client, msg.getId(), (err, data) => {
          if (err) reject(err);
          else resolve(data ?? []);
        });
      },
    );

    expect(metadata.length).toBe(9);
    expect(metadata[0].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(metadata[1].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(metadata[1].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(metadata[2].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(metadata[3].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(metadata[3].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(metadata[4].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(metadata[5].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(metadata[5].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(metadata[6].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(metadata[7].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(metadata[7].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(metadata[8].type).toBe(EMessageMetadataType.DEAD_LETTER);
    expect(metadata[8].deadLetterCause).toBe(
      EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
    );
  });

  test('Case 2', async () => {
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

    const metadata = await new Promise<TMessageMetadata[]>(
      (resolve, reject) => {
        Metadata.getMessageMetadata(client, msg.getId(), (err, data) => {
          if (err) reject(err);
          else resolve(data ?? []);
        });
      },
    );

    expect(metadata.length).toBe(2);
    expect(metadata[0].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(metadata[1].type).toBe(EMessageMetadataType.DEAD_LETTER);
    expect(metadata[1].deadLetterCause).toBe(
      EMessageDeadLetterCause.TTL_EXPIRED,
    );
  });

  test('Case 3', async () => {
    const message = new Message();
    message.setScheduledDelay(10);

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
    const metadata = await new Promise<TMessageMetadata[]>(
      (resolve, reject) => {
        Metadata.getMessageMetadata(client, message.getId(), (err, data) => {
          if (err) reject(err);
          else resolve(data ?? []);
        });
      },
    );

    expect(metadata.length).toBe(4);
    expect(metadata[0].type).toBe(EMessageMetadataType.SCHEDULED);
    expect(metadata[1].type).toBe(EMessageMetadataType.SCHEDULED_ENQUEUED);
    expect(metadata[2].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(metadata[3].type).toBe(EMessageMetadataType.ACKNOWLEDGED);
  });

  test('Case 4', async () => {
    const message = new Message();
    message.setScheduledDelay(10);

    const producer = getProducer();
    await producer.produceMessageAsync(message);

    const consumer = getConsumer({
      consumeMock: jest.fn((msg, cb) => {
        cb();
      }),
    });
    await consumer.runAsync();
    const scheduler = promisifyAll(await getScheduler(consumer.getQueueName()));

    await scheduler.deleteScheduledMessageAsync(message.getId());

    const client = await getRedisInstance();
    const metadata = await new Promise<TMessageMetadata[]>(
      (resolve, reject) => {
        Metadata.getMessageMetadata(client, message.getId(), (err, data) => {
          if (err) reject(err);
          else resolve(data ?? []);
        });
      },
    );

    expect(metadata.length).toBe(2);
    expect(metadata[0].type).toBe(EMessageMetadataType.SCHEDULED);
    expect(metadata[1].type).toBe(EMessageMetadataType.SCHEDULED_DELETED);
  });
});
