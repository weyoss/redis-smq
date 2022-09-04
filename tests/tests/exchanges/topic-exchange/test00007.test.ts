import { Message } from '../../../../src/lib/message/message';
import { getProducer } from '../../../common/producer';
import { MessageNotPublishedError } from '../../../../src/lib/producer/errors/message-not-published.error';
import { TopicExchange } from '../../../../src/lib/exchange/topic-exchange';

test('TopicExchange: producing messages having an exchange without matched queues ', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const e = new TopicExchange('a.b.c.d');
  const msg = new Message().setExchange(e).setBody('hello');

  await expect(async () => await producer.produceAsync(msg)).rejects.toThrow(
    MessageNotPublishedError,
  );
});
