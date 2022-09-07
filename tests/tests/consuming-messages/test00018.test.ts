import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';
import { MessageAlreadyPublishedError } from '../../../src/lib/producer/errors/message-already-published.error';

test('Producing duplicate messages', async () => {
  await createQueue(defaultQueue, false);
  const { producer, message } = await produceMessage();
  await expect(async () => {
    await producer.produceAsync(message);
  }).rejects.toThrow(MessageAlreadyPublishedError);
});
