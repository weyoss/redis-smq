import { getQueueManager } from '../../../common/queue-manager';
import { FanOutExchange } from '../../../../src/lib/exchange/fan-out-exchange';
import { getRedisInstance } from '../../../common/redis';
import { requiredConfig } from '../../../common/config';
import { promisifyAll } from 'bluebird';
import { isEqual } from '../../../common/util';
import { getFanOutExchangeManager } from '../../../common/fanout-exchange-manager';

test('FanOutExchange: getQueues() ', async () => {
  const { queue } = await getQueueManager();
  const fanOutExchangeManager = await getFanOutExchangeManager();

  const q1 = { ns: 'testing', name: 'w123' };
  const q2 = { ns: 'testing', name: 'w456' };

  await queue.createAsync(q1, false);
  await queue.createAsync(q2, false);

  const exchange = promisifyAll(new FanOutExchange('fanout_a'));
  await fanOutExchangeManager.bindQueueToExchangeAsync(exchange, q1);
  await fanOutExchangeManager.bindQueueToExchangeAsync(exchange, q2);

  const redisClient = await getRedisInstance();
  const r = await exchange.getQueuesAsync(redisClient, requiredConfig);
  expect(isEqual(r, [q1, q2])).toBe(true);
});
