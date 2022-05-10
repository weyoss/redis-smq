import { Message } from '../../src/system/app/message/message';
import {
  createQueue,
  getConsumer,
  getProducer,
  getQueueManager,
  untilMessageAcknowledged,
} from '../common';

test('Consume messages from different queues and published by a single producer instance', async () => {
  const producer = getProducer();
  for (let i = 0; i < 5; i += 1) {
    const queue = `QuEue_${i}`;
    await createQueue(queue, false);

    const message = new Message();
    // queue name should be normalized to lowercase
    message.setBody(`Message ${i}`).setQueue(queue);
    await producer.produceAsync(message);
  }
  const metrics = await getQueueManager();
  for (let i = 0; i < 5; i += 1) {
    // Be carefull here: queue name is always in lowercase. Otherwise it will be not normalized
    const m1 = await metrics.queueMetrics.getQueueMetricsAsync(`queue_${i}`);
    expect(m1).toEqual({
      acknowledged: 0,
      deadLettered: 0,
      pending: 1,
      pendingWithPriority: 0,
    });

    // queue name should be normalized to lowercase
    const consumer = getConsumer({
      queue: `queUE_${i}`,
      messageHandler: (msg, cb) => {
        // message handlers start consuming messages once started and before the consumer is fully started (when events.UP is emitted)
        // untilMessageAcknowledged() may miss acknowledged events
        // As a workaround, adding a delay before acknowledging a message
        setTimeout(cb, 10000);
      },
    });
    await consumer.runAsync();
    await untilMessageAcknowledged(consumer);
    await consumer.shutdownAsync();

    //
    const m2 = await metrics.queueMetrics.getQueueMetricsAsync(`queue_${i}`);
    expect(m2).toEqual({
      acknowledged: 1,
      deadLettered: 0,
      pending: 0,
      pendingWithPriority: 0,
    });
  }
});
