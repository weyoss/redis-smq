import { ExchangeFanOutError } from '../../../../src/lib/exchange/errors';
import { EQueueType } from '../../../../types';
import { getQueue } from '../../../common/queue';
import { getFanOutExchange } from '../../../common/exchange';

test('ExchangeFanOut: binding different types of queues', async () => {
  const e1 = getFanOutExchange('e1');
  await e1.saveExchangeAsync();

  const q1 = { ns: 'testing', name: 'w123' };
  const queueInstance = await getQueue();
  await queueInstance.saveAsync(q1, EQueueType.LIFO_QUEUE);
  await e1.bindQueueAsync(q1);

  const q2 = { ns: 'testing', name: 'w456' };
  await queueInstance.saveAsync(q2, EQueueType.PRIORITY_QUEUE);

  await expect(e1.bindQueueAsync(q2)).rejects.toThrow(ExchangeFanOutError);
});
