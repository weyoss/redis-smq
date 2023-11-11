import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getProducer } from '../../common/producer';
import { Message } from '../../../src/lib/message/message';
import { MessageState } from '../../../src/lib/message/message-state';

test('Producing a message', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  expect(msg.getMessageState()).toBe(null);
  expect(msg.getId()).toBe(null);

  await producer.produceAsync(msg);

  expect((msg.getMessageState() ?? {}) instanceof MessageState).toBe(true);
  expect(typeof msg.getId() === 'string').toBe(true);
});
