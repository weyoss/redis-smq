import { Message } from '../../../../src/lib/message/message';
import { getProducer } from '../../../common/producer';
import { MessageNotPublishedError } from '../../../../src/lib/producer/errors/message-not-published.error';
import { ExchangeTopic } from '../../../../src/lib/exchange/exchange-topic';

test('ExchangeTopic: producing message having an exchange without matched queues ', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const e = new ExchangeTopic('a.b.c.d');
  const msg = new Message().setExchange(e).setBody('hello');

  await expect(async () => await producer.produceAsync(msg)).rejects.toThrow(
    MessageNotPublishedError,
  );
});
