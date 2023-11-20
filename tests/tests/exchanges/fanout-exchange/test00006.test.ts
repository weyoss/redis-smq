import { Message } from '../../../../src/lib/message/message';
import { getProducer } from '../../../common/producer';
import { ExchangeFanOut } from '../../../../src/lib/exchange/exchange-fan-out';
import { ProducerMessageNotPublishedError } from '../../../../src/lib/producer/errors';

test('ExchangeFanOut: producing message having an exchange without matched queues ', async () => {
  const producer = getProducer();
  await producer.runAsync();

  const e = new ExchangeFanOut('fanout_a');
  const msg = new Message().setExchange(e).setBody('hello');

  await expect(async () => await producer.produceAsync(msg)).rejects.toThrow(
    ProducerMessageNotPublishedError,
  );
});
