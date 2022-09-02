import { getQueueManager } from '../../../common/queue-manager';
import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { isEqual } from '../../../common/util';
import { getFanOutExchangeManager } from '../../../common/fanout-exchange-manager';

test('QueueExchange: bindQueueToExchange(), getExchangeBindings(), unbindQueueFromExchange()', async () => {
  const { queue } = await getQueueManager();
  const fanOutExchangeManager = await getFanOutExchangeManager();

  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  await queue.createAsync(q1, false);
  await queue.createAsync(q2, false);

  const exchange = new FanOutExchange('fanout_a');
  await fanOutExchangeManager.bindQueueToExchangeAsync(exchange, q1);
  await fanOutExchangeManager.bindQueueToExchangeAsync(exchange, q2);

  const r1 = await fanOutExchangeManager.getExchangeBindingsAsync(exchange);
  expect(isEqual(r1, [q1, q2])).toBe(true);

  const r2 = await fanOutExchangeManager.getQueueExchangeBindingAsync(q1);
  expect(r2).toEqual(exchange.getBindingParams());

  const r3 = await fanOutExchangeManager.getQueueExchangeBindingAsync(q2);
  expect(r3).toEqual(exchange.getBindingParams());

  await fanOutExchangeManager.unbindQueueFromExchangeAsync(q1, exchange);

  const r4 = await fanOutExchangeManager.getExchangeBindingsAsync(exchange);
  expect(isEqual(r4, [q2])).toBe(true);

  const r5 = await fanOutExchangeManager.getQueueExchangeBindingAsync(q1);
  expect(r5).toEqual(undefined);

  const r6 = await fanOutExchangeManager.getQueueExchangeBindingAsync(q2);
  expect(r6).toEqual(exchange.getBindingParams());
});
