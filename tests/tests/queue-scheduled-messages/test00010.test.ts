import { Message } from '../../../src/lib/message/message';
import { ProducerMessageNotScheduledError } from '../../../src/lib/producer/errors';
import { getProducer } from '../../common/producer';
import { EQueueType } from '../../../types';
import { getQueue } from '../../common/queue';

test('Scheduling a message and expecting different kind of failures', async () => {
  const queue = await getQueue();
  await queue.saveAsync('test0', EQueueType.LIFO_QUEUE);
  await queue.saveAsync('test1', EQueueType.PRIORITY_QUEUE);

  const producer = getProducer();
  await producer.runAsync();

  try {
    const msg = new Message()
      .setQueue('test0')
      .setBody('body')
      .setPriority(Message.MessagePriority.LOW)
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotScheduledError ? e.message : '';
    expect(m).toBe('PRIORITY_QUEUING_NOT_ENABLED');
  }

  try {
    const msg1 = new Message()
      .setQueue('test1')
      .setBody('body')
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg1);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotScheduledError ? e.message : '';
    expect(m).toBe('MESSAGE_PRIORITY_REQUIRED');
  }

  try {
    const msg2 = new Message()
      .setQueue('test2')
      .setBody('body')
      .setScheduledCRON('* * * * * *');
    await producer.produceAsync(msg2);
  } catch (e: unknown) {
    const m = e instanceof ProducerMessageNotScheduledError ? e.message : '';
    expect(m).toBe('QUEUE_NOT_FOUND');
  }
});
