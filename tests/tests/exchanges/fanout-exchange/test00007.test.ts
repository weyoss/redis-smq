import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { getFanOutExchangeManager } from '../../../common/fanout-exchange-manager';
import { getQueueManager } from '../../../common/queue-manager';

test('FanOutExchange: creating and deleting an exchange', async () => {
  const fanOutExchangeManager = await getFanOutExchangeManager();

  const e1 = new FanOutExchange('e1');
  await fanOutExchangeManager.createExchangeAsync(e1);
  await fanOutExchangeManager.createExchangeAsync(e1);

  const e2 = new FanOutExchange('e2');
  await fanOutExchangeManager.createExchangeAsync(e2);

  const r1 = await fanOutExchangeManager.getExchangesAsync();
  expect(r1.sort()).toEqual(['e1', 'e2']);

  const q1 = { ns: 'testing', name: 'w123' };
  const { queue } = await getQueueManager();
  await queue.createAsync(q1, false);
  await fanOutExchangeManager.bindQueueAsync(q1, e1);
  await fanOutExchangeManager.bindQueueAsync(q1, e1);

  const r4 = await fanOutExchangeManager.getExchangeQueuesAsync(e1);
  expect(r4).toEqual([q1]);

  await fanOutExchangeManager.bindQueueAsync(q1, e2);

  const r5 = await fanOutExchangeManager.getExchangeQueuesAsync(e1);
  expect(r5).toEqual([]);

  const r6 = await fanOutExchangeManager.getExchangeQueuesAsync(e2);
  expect(r6).toEqual([q1]);

  await expect(fanOutExchangeManager.deleteExchangeAsync(e2)).rejects.toThrow(
    `Exchange has 1 bound queue(s). Unbind all queues before deleting the exchange.`,
  );

  await fanOutExchangeManager.unbindQueueAsync(q1, e2);
  await expect(fanOutExchangeManager.unbindQueueAsync(q1, e2)).rejects.toThrow(
    `Queue ${q1.name}@${q1.ns} is not bound to [e2] exchange.`,
  );

  await fanOutExchangeManager.deleteExchangeAsync(e2);
  const r7 = await fanOutExchangeManager.getExchangesAsync();
  expect(r7).toEqual(['e1']);
});
