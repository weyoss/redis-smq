import { ExchangeFanOut } from '../../../../src/lib/exchange/exchange-fan-out';
import { isEqual } from '../../../common/util';
import { EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';
import { promisifyAll } from 'bluebird';

const FanOutExchangeAsync = promisifyAll(ExchangeFanOut);

test('QueueExchange: bindQueue(), getExchangeQueues(), unbindQueue()', async () => {
  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };
  const q3 = { ns: 'testing', name: 'w789' };

  const queue = await getQueue();
  await queue.saveAsync(q1, EQueueType.LIFO_QUEUE);
  await queue.saveAsync(q2, EQueueType.LIFO_QUEUE);
  await queue.saveAsync(q3, EQueueType.LIFO_QUEUE);

  const exchangeA = getFanOutExchange('fanout_a');
  const exchangeB = getFanOutExchange('fanout_b');
  await exchangeA.bindQueueAsync(q1);
  await exchangeA.bindQueueAsync(q2);
  await exchangeB.bindQueueAsync(q3);

  const r0 = await exchangeA.getQueuesAsync();
  expect(isEqual(r0, [q1, q2])).toBe(true);

  const r1 = await exchangeB.getQueuesAsync();
  expect(isEqual(r1, [q3])).toBe(true);

  const r2 = await FanOutExchangeAsync.getQueueExchangeAsync(q1);
  expect(r2?.getBindingParams()).toEqual(exchangeA.getBindingParams());

  const r3 = await FanOutExchangeAsync.getQueueExchangeAsync(q2);
  expect(r3?.getBindingParams()).toEqual(exchangeA.getBindingParams());

  await exchangeA.unbindQueueAsync(q1);

  const r4 = await exchangeA.getQueuesAsync();
  expect(isEqual(r4, [q2])).toBe(true);

  const r5 = await FanOutExchangeAsync.getQueueExchangeAsync(q1);
  expect(r5).toEqual(null);

  const r6 = await FanOutExchangeAsync.getQueueExchangeAsync(q2);
  expect(r6?.getBindingParams()).toEqual(exchangeA.getBindingParams());

  const r7 = await FanOutExchangeAsync.getAllExchangesAsync();
  expect(r7.sort()).toEqual(
    [exchangeA.getBindingParams(), exchangeB.getBindingParams()].sort(),
  );
});
