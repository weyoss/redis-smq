import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/app/message/message';
import {
  getConsumer,
  getProducer,
  getQueueManagerFrontend,
  untilMessageAcknowledged,
} from '../common';

test('Consume messages from different queues and published by a single producer instance', async () => {
  const producer = getProducer();
  for (let i = 0; i < 5; i += 1) {
    const message = new Message();
    // queue name should be normalized to lowercase
    message.setBody(`Message ${i}`).setQueue(`QuEue_${i}`);
    const r = await producer.produceAsync(message);
    expect(r).toBe(true);
  }
  const metrics = promisifyAll(await getQueueManagerFrontend());
  for (let i = 0; i < 5; i += 1) {
    // Be carefull here: queue name is always in lowercase. Otherwise it will be not normalized
    const m1 = await metrics.getQueueMetricsAsync(`queue_${i}`);
    expect(m1).toEqual({
      acknowledged: 0,
      deadLettered: 0,
      pending: 1,
      pendingWithPriority: 0,
    });

    // queue name should be normalized to lowercase
    const consumer = getConsumer({ queue: `queUE_${i}` });
    await consumer.runAsync();
    await untilMessageAcknowledged(consumer);
    await consumer.shutdownAsync();

    //
    const m2 = await metrics.getQueueMetricsAsync(`queue_${i}`);
    expect(m2).toEqual({
      acknowledged: 1,
      deadLettered: 0,
      pending: 0,
      pendingWithPriority: 0,
    });
  }
});
