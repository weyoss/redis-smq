import { Message } from '../../../src/lib/message/message';
import { MessageNotPublishedError } from '../../../src/lib/producer/errors/message-not-published.error';
import { getQueueManager } from '../../common/queue-manager';
import { getProducer } from '../../common/producer';

test('Producing a message and expecting different kind of failures', async () => {
  const qm = await getQueueManager();
  await qm.queue.createAsync('test0', false);
  await qm.queue.createAsync('test1', true);

  const producer = getProducer();

  try {
    const msg = new Message()
      .setQueue('test0')
      .setBody('body')
      .setPriority(Message.MessagePriority.LOW);
    await producer.produceAsync(msg);
  } catch (e: unknown) {
    const m = e instanceof MessageNotPublishedError ? e.message : '';
    expect(m).toBe('PRIORITY_QUEUING_NOT_ENABLED');
  }

  try {
    const msg1 = new Message().setQueue('test1').setBody('body');
    await producer.produceAsync(msg1);
  } catch (e: unknown) {
    const m = e instanceof MessageNotPublishedError ? e.message : '';
    expect(m).toBe('MESSAGE_PRIORITY_REQUIRED');
  }

  try {
    const msg2 = new Message().setQueue('test2').setBody('body');
    await producer.produceAsync(msg2);
  } catch (e: unknown) {
    const m = e instanceof MessageNotPublishedError ? e.message : '';
    expect(m).toBe('QUEUE_NOT_FOUND');
  }
});
