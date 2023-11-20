import { Message } from '../../../index';
import { getProducer } from '../../common/producer';
import { MessageExchangeRequiredError } from '../../../src/lib/message/errors';

test('Producing a message without a message queue', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await expect(async () => {
    await producer.produceAsync(msg);
  }).rejects.toThrow(MessageExchangeRequiredError);
});
