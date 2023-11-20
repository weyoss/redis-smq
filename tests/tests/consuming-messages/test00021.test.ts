import { Message } from '../../../index';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { ProducerInstanceNotRunningError } from '../../../src/lib/producer/errors';

test('Shutdown a producer and try to produce a message', async () => {
  const producer = getProducer();
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
  await expect(async () => {
    await producer.produceAsync(msg);
  }).rejects.toThrowError(ProducerInstanceNotRunningError);
});
