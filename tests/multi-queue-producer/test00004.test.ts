import { MultiQueueProducer } from '../..';
import { config } from '../config';
import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/message';

test('MultiQueueProducer: Case 4', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  const message1 = new Message();
  message1.setBody(`Message 1`).setScheduledDelay(10000);
  const r1 = await mProducer.produceAsync(`queue_a`, message1);
  expect(r1).toBe(true);
  const message2 = new Message();
  message2.setBody(`Message 2`);
  const r2 = await mProducer.produceAsync(`queue_a`, message2);
  expect(r2).toBe(true);
  await mProducer.shutdownAsync();
});
