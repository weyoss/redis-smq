import { getQueueManager } from '../../../common/queue-manager';
import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { isEqual } from '../../../common/util';
import { getFanOutExchangeManager } from '../../../common/fanout-exchange-manager';

test('QueueExchange: bindQueue(), getExchangeQueues(), unbindQueue()', async () => {
  const { queue } = await getQueueManager();
  const fanOutExchangeManager = await getFanOutExchangeManager();

  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };
  const q3 = { ns: 'testing', name: 'w789' };

  await queue.createAsync(q1, false);
  await queue.createAsync(q2, false);
  await queue.createAsync(q3, false);

  const exchangeA = new FanOutExchange('fanout_a');
  const exchangeB = new FanOutExchange('fanout_b');
  await fanOutExchangeManager.bindQueueAsync(q1, exchangeA);
  await fanOutExchangeManager.bindQueueAsync(q2, exchangeA);
  await fanOutExchangeManager.bindQueueAsync(q3, exchangeB);

  const r0 = await fanOutExchangeManager.getExchangeQueuesAsync(exchangeA);
  expect(isEqual(r0, [q1, q2])).toBe(true);

  const r1 = await fanOutExchangeManager.getExchangeQueuesAsync(exchangeB);
  expect(isEqual(r1, [q3])).toBe(true);

  const r2 = await fanOutExchangeManager.getQueueExchangeAsync(q1);
  expect(r2.getBindingParams()).toEqual(exchangeA.getBindingParams());

  const r3 = await fanOutExchangeManager.getQueueExchangeAsync(q2);
  expect(r3.getBindingParams()).toEqual(exchangeA.getBindingParams());

  await fanOutExchangeManager.unbindQueueAsync(q1, exchangeA);

  const r4 = await fanOutExchangeManager.getExchangeQueuesAsync(exchangeA);
  expect(isEqual(r4, [q2])).toBe(true);

  const r5 = await fanOutExchangeManager.getQueueExchangeAsync(q1);
  expect(r5).toEqual(undefined);

  const r6 = await fanOutExchangeManager.getQueueExchangeAsync(q2);
  expect(r6.getBindingParams()).toEqual(exchangeA.getBindingParams());

  const r7 = await fanOutExchangeManager.getExchangesAsync();
  expect(r7.sort()).toEqual(
    [exchangeA.getBindingParams(), exchangeB.getBindingParams()].sort(),
  );
});
