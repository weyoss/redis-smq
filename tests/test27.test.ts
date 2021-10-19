import { getMessageManager, getProducer, getQueueManager } from './common';
import { Message } from '../src/message';
import { promisifyAll } from 'bluebird';
import { EMessageMetadataType } from '../types';

describe('MessageManager: deletePendingMessage with priority', () => {
  test('Case 1', async () => {
    const msg = new Message();
    msg.setBody({ hello: 'world' });

    const producer = getProducer('test_queue', {
      priorityQueue: true,
    });
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManager());
    const res1 = await messageManager.getPendingMessagesWithPriorityAsync(
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
    expect(queueMetadata1.pendingWithPriority).toBe(1);

    await messageManager.deletePendingMessageAsync(
      producer.getQueueName(),
      msg.getId(),
    );
    const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
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
    expect(msgMeta[0].type).toBe(EMessageMetadataType.ENQUEUED_WITH_PRIORITY);
    expect(msgMeta[0].state).toEqual(msg);
    expect(msgMeta[1].type).toBe(
      EMessageMetadataType.DELETED_FROM_PRIORITY_QUEUE,
    );

    const msg1 = Message.createFromMessage(msg);
    msg1.setPriority(Message.MessagePriority.NORMAL);
    expect(msgMeta[1].state).toEqual(msg1);

    await expect(async () => {
      await messageManager.deletePendingMessageAsync(
        producer.getQueueName(),
        msg.getId(),
      );
    }).rejects.toThrow('Message last metadata does not match expected ones');

    await expect(async () => {
      await messageManager.deletePendingMessageAsync(
        producer.getQueueName(),
        new Message().getId(),
      );
    }).rejects.toThrow('Message does not exist');
  });
});
