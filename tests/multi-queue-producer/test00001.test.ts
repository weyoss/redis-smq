import { MultiQueueProducer } from '../..';
import { config } from '../config';
import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/message';
import { getQueueManagerFrontend } from '../common';

test('MultiQueueProducer: Case 1', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  for (let i = 0; i < 5; i += 1) {
    const message = new Message();
    message.setBody(`Message ${i}`);
    const r = await mProducer.produceAsync(`queue_${i}`, message);
    expect(r).toBe(true);
  }
  await mProducer.shutdownAsync();
  const metrics = promisifyAll(await getQueueManagerFrontend());
  const m1 = await metrics.getQueueMetricsAsync({
    ns: 'testing',
    name: 'queue_0',
  });
  expect(m1).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: 1,
    pendingWithPriority: 0,
  });
  const m2 = await metrics.getQueueMetricsAsync({
    ns: 'testing',
    name: 'queue_1',
  });
  expect(m2).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: 1,
    pendingWithPriority: 0,
  });
  const m3 = await metrics.getQueueMetricsAsync({
    ns: 'testing',
    name: 'queue_2',
  });
  expect(m3).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: 1,
    pendingWithPriority: 0,
  });
  const m4 = await metrics.getQueueMetricsAsync({
    ns: 'testing',
    name: 'queue_3',
  });
  expect(m4).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: 1,
    pendingWithPriority: 0,
  });
  const m5 = await metrics.getQueueMetricsAsync({
    ns: 'testing',
    name: 'queue_4',
  });
  expect(m5).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: 1,
    pendingWithPriority: 0,
  });
});
