import { MultiQueueProducer } from '../..';
import { config } from '../config';
import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/message';
import {
  getConsumer,
  getQueueManagerFrontend,
  untilConsumerEvent,
} from '../common';
import { events } from '../../src/system/common/events';

test('MultiQueueProducer: Case 7', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  for (let i = 0; i < 5; i += 1) {
    const message = new Message();
    message.setBody(`Message ${i}`);
    // queue name should be normalized to lowercase
    const r = await mProducer.produceAsync(`QuEue_${i}`, message);
    expect(r).toBe(true);
  }
  await mProducer.shutdownAsync();
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
    const consumer = getConsumer({ queueName: `queUE_${i}` });
    await consumer.runAsync();
    await untilConsumerEvent(consumer, events.MESSAGE_ACKNOWLEDGED);
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
