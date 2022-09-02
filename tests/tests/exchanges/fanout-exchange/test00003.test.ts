import { Message } from '../../../../src/lib/message/message';
import { getProducer } from '../../../common/producer';
import { getQueueManager } from '../../../common/queue-manager';
import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { isEqual } from '../../../common/util';

test('FanOutExchange: producing messages using setTopic()', async () => {
  const { queueExchange, queue } = await getQueueManager();

  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  await queue.createAsync(q1, false);
  await queue.createAsync(q2, false);

  const exchange = new FanOutExchange('fanout_a');
  await queueExchange.bindQueueToExchangeAsync(exchange, q1);
  await queueExchange.bindQueueToExchangeAsync(exchange, q2);

  const producer = getProducer();
  await producer.runAsync();

  const msg = new Message().setFanOut('fanout_a').setBody('hello');

  const r = await producer.produceAsync(msg);
  expect(r.scheduled).toEqual(false);
  expect(
    isEqual(
      r.messages.map((i) => i.getDestinationQueue()),
      [q1, q2],
    ),
  ).toBe(true);
});
