import { isEqual } from '../../../common/util';
import { EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';

test('ExchangeFanOut: getQueues() ', async () => {
  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  const queue = await getQueue();
  await queue.saveAsync(q1, EQueueType.LIFO_QUEUE);
  await queue.saveAsync(q2, EQueueType.LIFO_QUEUE);

  const exchange = getFanOutExchange('fanout_a');
  await exchange.bindQueueAsync(q1);
  await exchange.bindQueueAsync(q2);

  const r = await exchange.getQueuesAsync();
  expect(isEqual(r, [q1, q2])).toBe(true);
});
