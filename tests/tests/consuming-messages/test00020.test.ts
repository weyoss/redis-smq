import { Message } from '../../../index';
import { getProducer } from '../../common/producer';

test('Producing a message without a message queue', async () => {
  const producer = getProducer();

  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await expect(async () => {
    await producer.produceAsync(msg);
  }).rejects.toThrow('Can not publish a message without a message queue');
});
