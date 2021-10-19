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

describe('MessageManager: deleteDeadLetterMessage', () => {
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
    }).rejects.toThrow('Message last metadata does not match expected ones');

    await expect(async () => {
      await messageManager.deleteDeadLetterMessageAsync(
        producer.getQueueName(),
        new Message().getId(),
      );
    }).rejects.toThrow('Message does not exist');
  });
});
