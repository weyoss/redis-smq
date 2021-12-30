import { MultiQueueProducer } from '../..';
import { config } from '../config';
import { promisifyAll } from 'bluebird';

test('MultiQueueProducer: Case 5', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  const r1 = await mProducer.produceAsync(`queue_a`, 'message 1');
  expect(r1).toBe(true);
  await mProducer.shutdownAsync();
  await expect(async () => {
    await mProducer.produceAsync(`queue_a`, 'message 1');
  }).rejects.toThrow(`Producer ID ${mProducer.getId()} is not running`);
});
