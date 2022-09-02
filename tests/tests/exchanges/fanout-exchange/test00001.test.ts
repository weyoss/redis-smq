import { getQueueManager } from '../../../common/queue-manager';
import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { isEqual } from '../../../common/util';

test('QueueExchange: bindQueueToExchange(), getExchangeBindings(), unbindQueueFromExchange()', async () => {
  const { queueExchange, queue } = await getQueueManager();

  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  await queue.createAsync(q1, false);
  await queue.createAsync(q2, false);

  const exchange = new FanOutExchange('fanout_a');
  await queueExchange.bindQueueToExchangeAsync(exchange, q1);
  await queueExchange.bindQueueToExchangeAsync(exchange, q2);

  const r1 = await queueExchange.getExchangeBindingsAsync(exchange);
  expect(isEqual(r1, [q1, q2])).toBe(true);

  const r2 = await queueExchange.getQueueExchangeBindingAsync(q1);
  expect(r2).toEqual(exchange.getBindingParams());

  const r3 = await queueExchange.getQueueExchangeBindingAsync(q2);
  expect(r3).toEqual(exchange.getBindingParams());

  await queueExchange.unbindQueueFromExchangeAsync(q1, exchange);

  const r4 = await queueExchange.getExchangeBindingsAsync(exchange);
  expect(isEqual(r4, [q2])).toBe(true);

  const r5 = await queueExchange.getQueueExchangeBindingAsync(q1);
  expect(r5).toEqual(undefined);

  const r6 = await queueExchange.getQueueExchangeBindingAsync(q2);
  expect(r6).toEqual(exchange.getBindingParams());
});
