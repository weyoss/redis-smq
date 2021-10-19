import {
  getConsumer,
  getMessageManager,
  getProducer,
  getRedisInstance,
  untilConsumerIdle,
  untilMessageAcknowledged,
} from './common';
import { Message } from '../src/message';
import {
  EMessageDeadLetterCause,
  EMessageMetadataType,
  EMessageUnacknowledgedCause,
  IMessageMetadata,
} from '../types';
import { delay, promisifyAll } from 'bluebird';
import { metadata } from '../src/system/metadata';

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

    const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
      metadata.getMessageMetadata(client, msg.getId(), (err, data) => {
        if (err) reject(err);
        else resolve(data ?? []);
      });
    });

    expect(m.length).toBe(9);
    expect(m[0].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(m[1].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(m[1].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(m[2].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(m[3].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(m[3].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(m[4].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(m[5].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(m[5].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(m[6].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(m[7].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(m[7].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.CAUGHT_ERROR,
    );
    expect(m[8].type).toBe(EMessageMetadataType.DEAD_LETTER);
    expect(m[8].deadLetterCause).toBe(
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

    const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
      metadata.getMessageMetadata(client, msg.getId(), (err, data) => {
        if (err) reject(err);
        else resolve(data ?? []);
      });
    });

    expect(m.length).toBe(3);
    expect(m[0].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(m[1].type).toBe(EMessageMetadataType.UNACKNOWLEDGED);
    expect(m[1].unacknowledgedCause).toBe(
      EMessageUnacknowledgedCause.TTL_EXPIRED,
    );
    expect(m[2].type).toBe(EMessageMetadataType.DEAD_LETTER);
    expect(m[2].deadLetterCause).toBe(EMessageDeadLetterCause.TTL_EXPIRED);
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
    const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
      metadata.getMessageMetadata(client, message.getId(), (err, data) => {
        if (err) reject(err);
        else resolve(data ?? []);
      });
    });

    expect(m.length).toBe(4);
    expect(m[0].type).toBe(EMessageMetadataType.SCHEDULED);
    expect(m[1].type).toBe(EMessageMetadataType.SCHEDULED_ENQUEUED);
    expect(m[2].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(m[3].type).toBe(EMessageMetadataType.ACKNOWLEDGED);
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
    const messageManager = promisifyAll(await getMessageManager());

    await messageManager.deleteScheduledMessageAsync(
      consumer.getQueueName(),
      message.getId(),
    );

    const client = await getRedisInstance();
    const m = await new Promise<IMessageMetadata[]>((resolve, reject) => {
      metadata.getMessageMetadata(client, message.getId(), (err, data) => {
        if (err) reject(err);
        else resolve(data ?? []);
      });
    });

    expect(m.length).toBe(2);
    expect(m[0].type).toBe(EMessageMetadataType.SCHEDULED);
    expect(m[1].type).toBe(EMessageMetadataType.DELETED_FROM_SCHEDULED_QUEUE);
  });
});
