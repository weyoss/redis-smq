import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { getFanOutExchangeManager } from '../../../common/fanout-exchange-manager';
import { getQueueManager } from '../../../common/queue-manager';
import { FanOutExchangeQueueError } from '../../../../src/lib/exchange/errors/fan-out-exchange-queue.error';

test('FanOutExchange: binding different types of queues', async () => {
  const fanOutExchangeManager = await getFanOutExchangeManager();

  const e1 = new FanOutExchange('e1');
  await fanOutExchangeManager.createExchangeAsync(e1);

  const q1 = { ns: 'testing', name: 'w123' };
  const { queue } = await getQueueManager();
  await queue.createAsync(q1, false);
  await fanOutExchangeManager.bindQueueAsync(q1, e1);

  const q2 = { ns: 'testing', name: 'w456' };
  await queue.createAsync(q2, true);

  await expect(fanOutExchangeManager.bindQueueAsync(q2, e1)).rejects.toThrow(
    FanOutExchangeQueueError,
  );
});
