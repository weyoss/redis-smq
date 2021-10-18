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

describe('MessageManager: deletePendingMessage/deleteAcknowledgedMessage/deleteDeadLetterMessage', () => {
  test('Case 1: deletePendingMessage', async () => {
    const msg = new Message();
    msg.setBody({ hello: 'world' });

    const producer = getProducer();
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

    const msgMeta = await messageManager.getMessageMetadataAsync(msg.getId());
    expect(msgMeta.length).toBe(2);

    expect(msgMeta[0].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(msgMeta[0].state).toEqual(msg);

    expect(msgMeta[1].type).toBe(EMessageMetadataType.DELETED_FROM_QUEUE);
    expect(msgMeta[1].state).toEqual(msg);

    await expect(async () => {
      await messageManager.deletePendingMessageAsync(
        producer.getQueueName(),
        msg.getId(),
      );
    }).rejects.toThrow('Message is not currently in pending queue');

    await expect(async () => {
      await messageManager.deletePendingMessageAsync(
        producer.getQueueName(),
        new Message().getId(),
      );
    }).rejects.toThrow('Message does not exist');
  });

  test('Case 2: deleteAcknowledgedMessage', async () => {
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

    const queueMetadata2 = await queueManager.getQueueMetadataAsync(
      producer.getQueueName(),
    );
    expect(queueMetadata2.acknowledged).toBe(0);

    const msgMeta = await messageManager.getMessageMetadataAsync(msg.getId());
    expect(msgMeta.length).toBe(3);

    expect(msgMeta[0].type).toBe(EMessageMetadataType.ENQUEUED);
    expect(msgMeta[0].state).toEqual(msg);

    expect(msgMeta[1].type).toBe(EMessageMetadataType.ACKNOWLEDGED);
    expect(msgMeta[1].state).toEqual(msg1);

    expect(msgMeta[2].type).toBe(
      EMessageMetadataType.DELETED_FROM_ACKNOWLEDGED_QUEUE,
    );
    expect(msgMeta[2].state).toEqual(msg1);

    await expect(async () => {
      await messageManager.deleteAcknowledgedMessageAsync(
        producer.getQueueName(),
        msg.getId(),
      );
    }).rejects.toThrow('Message is not currently in acknowledged queue');

    await expect(async () => {
      await messageManager.deleteAcknowledgedMessageAsync(
        producer.getQueueName(),
        new Message().getId(),
      );
    }).rejects.toThrow('Message does not exist');
  });

  test('Case 3: deleteDeadLetterMessage', async () => {
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

    await messageManager.deleteDeadLetterMessageAsync(
      producer.getQueueName(),
      msg.getId(),
    );

    const res4 = await messageManager.getDeadLetterMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res4.total).toBe(0);
    expect(res4.items.length).toBe(0);

    const queueMetadata2 = await queueManager.getQueueMetadataAsync(
      producer.getQueueName(),
    );
    expect(queueMetadata2.deadLetter).toBe(0);

    const msgMeta = await messageManager.getMessageMetadataAsync(msg.getId());
    expect(msgMeta.length).toBe(10);

    expect(msgMeta[9].type).toBe(EMessageMetadataType.DELETED_FROM_DL);
    expect(msgMeta[9].state).toEqual(msg1);

    await expect(async () => {
      await messageManager.deleteDeadLetterMessageAsync(
        producer.getQueueName(),
        msg.getId(),
      );
    }).rejects.toThrow('Message is not currently in dead-letter queue');

    await expect(async () => {
      await messageManager.deleteDeadLetterMessageAsync(
        producer.getQueueName(),
        new Message().getId(),
      );
    }).rejects.toThrow('Message does not exist');
  });
});
