import { defaultQueue, getProducer } from '../common';
import { Message } from '../../index';
import { delay } from 'bluebird';

test('Shutdown a producer and try to produce a message', async () => {
  const producer = getProducer();
  await delay(5000);
  await producer.shutdownAsync();

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
  await expect(async () => {
    await producer.produceAsync(msg);
  }).rejects.toThrow(`Producer ID ${producer.getId()} is not running`);
});
