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

describe('MessageManager: enqueueMessageWithPriorityFromAcknowledgedQueue', () => {
  test('Case 1', async () => {
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
    await consumer.shutdownAsync();

    const messageManager = promisifyAll(await getMessageManager());
    await messageManager.requeueMessageWithPriorityFromAcknowledgedQueueAsync(
      producer.getQueueName(),
      msg.getId(),
      undefined,
    );

    const res5 = await messageManager.getPendingMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res5.total).toBe(0);
    expect(res5.items.length).toBe(0);

    const res6 = await messageManager.getPendingMessagesWithPriorityAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res6.total).toBe(1);
    expect(res6.items.length).toBe(1);

    // assign default consumer options
    const msg1 = Message.createFromMessage(msg)
      .setTTL(0)
      .setRetryThreshold(3)
      .setRetryDelay(0)
      .setConsumeTimeout(0)
      .setPriority(Message.MessagePriority.NORMAL);
    expect(res6.items[0]).toEqual(msg1);

    const res7 = await messageManager.getAcknowledgedMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );
    expect(res7.total).toBe(0);
    expect(res7.items.length).toBe(0);

    const queueManager = promisifyAll(await getQueueManager());
    const queueMetadata2 = await queueManager.getQueueMetadataAsync(
      producer.getQueueName(),
    );
    expect(queueMetadata2.acknowledged).toBe(0);
    expect(queueMetadata2.pending).toBe(0);
    expect(queueMetadata2.pendingWithPriority).toBe(1);

    const msgMeta = await messageManager.getMessageMetadataAsync(msg.getId());
    expect(msgMeta.length).toBe(4);

    expect(msgMeta[2].type).toBe(
      EMessageMetadataType.DELETED_FROM_ACKNOWLEDGED_QUEUE,
    );
    const msg2 = Message.createFromMessage(msg)
      .setTTL(0)
      .setRetryThreshold(3)
      .setRetryDelay(0)
      .setConsumeTimeout(0);
    expect(msgMeta[2].state).toEqual(msg2);

    expect(msgMeta[3].type).toBe(EMessageMetadataType.ENQUEUED_WITH_PRIORITY);
    expect(msgMeta[3].state).toEqual(msg1);

    await expect(async () => {
      await messageManager.requeueMessageWithPriorityFromAcknowledgedQueueAsync(
        producer.getQueueName(),
        msg.getId(),
        undefined,
      );
    }).rejects.toThrow('Message last metadata does not match expected ones');

    await expect(async () => {
      await messageManager.requeueMessageWithPriorityFromAcknowledgedQueueAsync(
        producer.getQueueName(),
        new Message().getId(),
        undefined,
      );
    }).rejects.toThrow('Message does not exist');
  });
});
