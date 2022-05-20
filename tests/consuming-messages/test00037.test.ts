import { getProducer, getQueueManager } from '../common';
import { Message } from '../../src/app/message/message';
import { MessageNotScheduledError } from '../../src/app/producer/errors/message-not-scheduled.error';

test('Scheduling a message and expecting different kind of failures', async () => {
  const qm = await getQueueManager();
  await qm.queue.createAsync('test0', false);
  await qm.queue.createAsync('test1', true);

  const producer = getProducer();

  try {
    const msg = new Message()
      .setQueue('test0')
      .setBody('body')
      .setPriority(Message.MessagePriority.LOW)
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg);
  } catch (e: unknown) {
    const m = e instanceof MessageNotScheduledError ? e.message : '';
    expect(m).toBe('PRIORITY_QUEUING_NOT_ENABLED');
  }

  try {
    const msg1 = new Message()
      .setQueue('test1')
      .setBody('body')
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg1);
  } catch (e: unknown) {
    const m = e instanceof MessageNotScheduledError ? e.message : '';
    expect(m).toBe('MESSAGE_PRIORITY_REQUIRED');
  }

  try {
    const msg2 = new Message()
      .setQueue('test2')
      .setBody('body')
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg2);
  } catch (e: unknown) {
    const m = e instanceof MessageNotScheduledError ? e.message : '';
    expect(m).toBe('QUEUE_NOT_FOUND');
  }
});
