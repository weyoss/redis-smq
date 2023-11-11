import { Message } from '../../../../src/lib/message/message';
import { getProducer } from '../../../common/producer';
import { isEqual } from '../../../common/util';
import { EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';

test('ExchangeFanOut: producing message using setFanOut()', async () => {
  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  const queue = await getQueue();
  await queue.saveAsync(q1, EQueueType.LIFO_QUEUE);
  await queue.saveAsync(q2, EQueueType.LIFO_QUEUE);

  const exchange = getFanOutExchange('fanout_a');
  await exchange.bindQueueAsync(q1);
  await exchange.bindQueueAsync(q2);

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
