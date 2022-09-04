import { Message } from '../../../../src/lib/message/message';
import { getProducer } from '../../../common/producer';
import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { MessageNotPublishedError } from '../../../../src/lib/producer/errors/message-not-published.error';

test('FanOutExchange: producing messages having an exchange without matched queues ', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const e = new FanOutExchange('fanout_a');
  const msg = new Message().setExchange(e).setBody('hello');

  await expect(async () => await producer.produceAsync(msg)).rejects.toThrow(
    MessageNotPublishedError,
  );
});
