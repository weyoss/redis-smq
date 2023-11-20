import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';
import { ProducerMessageAlreadyPublishedError } from '../../../src/lib/producer/errors';

test('Producing duplicate message', async () => {
  await createQueue(defaultQueue, false);
  const { producer, message } = await produceMessage();
  await expect(async () => {
    await producer.produceAsync(message);
  }).rejects.toThrow(ProducerMessageAlreadyPublishedError);
});
