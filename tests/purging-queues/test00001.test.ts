import { getProducer, getQueueManagerFrontend } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging pending queue', async () => {
  const producer = getProducer();
  const { ns, name } = producer.getQueue();

  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m.pending).toBe(0);

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const m2 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m2.pending).toBe(1);

  await queueManager.purgeQueueAsync(name, ns);

  const m3 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m3.pending).toBe(0);
});
