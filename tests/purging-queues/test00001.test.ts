import { getProducer, getQueueManagerFrontend } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Purging pending queue', async () => {
  const producer = getProducer();
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(m.pending).toBe(0);

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const m2 = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(m2.pending).toBe(1);

  await queueManager.purgeQueueAsync(queueName, ns);

  const m3 = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(m3.pending).toBe(0);
});
