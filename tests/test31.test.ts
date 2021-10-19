import {
  getConsumer,
  getMessageManager,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from './common';
import { Message } from '../src/message';
import { promisifyAll } from 'bluebird';
import { EMessageMetadataType } from '../types';

describe('MessageManager: enqueueMessageFromDLQueue', () => {
  test('Case 1', async () => {
    const msg = new Message();
    msg.setBody({ hello: 'world' });

    const producer = getProducer();
    await producer.produceMessageAsync(msg);

    const consumer = getConsumer({
      consumeMock: (m, cb) => {
        throw new Error();
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
    expect(res2.total).toBe(0);
    expect(res2.items.length).toBe(0);

    const res3 = await messageManager.getDeadLetterMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );
    expect(res3.total).toBe(1);
    expect(res3.items.length).toBe(1);
    const msg1 = Message.createFromMessage(msg)
      .setTTL(0)
      .setRetryThreshold(3)
      .setRetryDelay(0)
      .setConsumeTimeout(0)
      .setAttempts(3);
    expect(res3.items[0]).toEqual(msg1);

    const queueManager = promisifyAll(await getQueueManager());
    const queueMetadata1 = await queueManager.getQueueMetadataAsync(
      producer.getQueueName(),
    );
    expect(queueMetadata1.pending).toBe(0);
    expect(queueMetadata1.acknowledged).toBe(0);
    expect(queueMetadata1.deadLetter).toBe(1);

    await messageManager.requeueMessageFromDLQueueAsync(
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
    expect(queueMetadata2.deadLetter).toBe(0);
    expect(queueMetadata2.pending).toBe(1);

    const msgMeta = await messageManager.getMessageMetadataAsync(msg.getId());
    expect(msgMeta.length).toBe(11);

    expect(msgMeta[9].type).toBe(EMessageMetadataType.DELETED_FROM_DL);
    expect(msgMeta[9].state).toEqual(msg1);

    expect(msgMeta[10].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(msgMeta[10].state).toEqual(msg2);

    await expect(async () => {
      await messageManager.requeueMessageFromDLQueueAsync(
        producer.getQueueName(),
        msg.getId(),
      );
    }).rejects.toThrow('Message last metadata does not match expected ones');

    await expect(async () => {
      await messageManager.requeueMessageFromDLQueueAsync(
        producer.getQueueName(),
        new Message().getId(),
      );
    }).rejects.toThrow('Message does not exist');
  });

  test('Case 2: enqueueDeadLetterMessage with priority', async () => {
    const msg = new Message();
    msg.setBody({ hello: 'world' });

    const producer = getProducer();
    await producer.produceMessageAsync(msg);

    const consumer = getConsumer({
      consumeMock: (m, cb) => {
        throw new Error();
      },
    });
    await consumer.runAsync();
    await untilConsumerIdle(consumer);
    await consumer.shutdownAsync();

    const messageManager = promisifyAll(await getMessageManager());
    await messageManager.requeueMessageWithPriorityFromDLQueueAsync(
      producer.getQueueName(),
      msg.getId(),
      undefined,
    );

    const res1 = await messageManager.getPendingMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );
    expect(res1.total).toBe(0);
    expect(res1.items.length).toBe(0);

    const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
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
      .setConsumeTimeout(0)
      .setPriority(Message.MessagePriority.NORMAL);
    expect(res2.items[0]).toEqual(msg1);

    const res3 = await messageManager.getDeadLetterMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );
    expect(res3.total).toBe(0);
    expect(res3.items.length).toBe(0);

    const queueManager = promisifyAll(await getQueueManager());
    const queueMetadata2 = await queueManager.getQueueMetadataAsync(
      producer.getQueueName(),
    );
    expect(queueMetadata2.deadLetter).toBe(0);
    expect(queueMetadata2.pending).toBe(0);
    expect(queueMetadata2.pendingWithPriority).toBe(1);

    const msgMeta = await messageManager.getMessageMetadataAsync(msg.getId());
    expect(msgMeta.length).toBe(11);

    expect(msgMeta[9].type).toBe(EMessageMetadataType.DELETED_FROM_DL);
    const msg2 = Message.createFromMessage(msg)
      .setTTL(0)
      .setRetryThreshold(3)
      .setRetryDelay(0)
      .setConsumeTimeout(0)
      .setAttempts(3);
    expect(msgMeta[9].state).toEqual(msg2);

    expect(msgMeta[10].type).toBe(EMessageMetadataType.ENQUEUED_WITH_PRIORITY);
    expect(msgMeta[10].state).toEqual(msg1);
  });
});
