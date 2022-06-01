import { Message } from '../../../index';
import { delay } from 'bluebird';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('Shutdown a producer and try to produce a message', async () => {
  const producer = getProducer();
  await delay(5000);
  await producer.shutdownAsync();
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
  await expect(async () => {
    await producer.produceAsync(msg);
  }).rejects.toThrow(`Producer ID ${producer.getId()} is not running`);
});
