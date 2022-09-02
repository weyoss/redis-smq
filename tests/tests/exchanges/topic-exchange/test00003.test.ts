import { TopicExchange } from '../../../../src/lib/exchange/topic-exchange';
import { requiredConfig } from '../../../common/config';
import { promisifyAll } from 'bluebird';
import { createQueue } from '../../../common/message-producing-consuming';
import { getRedisInstance } from '../../../common/redis';
import { isEqual } from '../../../common/util';

test('TopicExchange: fetching and matching queues', async () => {
  await createQueue({ ns: 'testing', name: 'w123.2.4.5' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4.5.6' }, false);
  await createQueue({ ns: 'beta', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2' }, false);
  await createQueue({ ns: 'testing', name: 'w123.2.4' }, false);

  const e1 = promisifyAll(new TopicExchange('w123.2.4'));
  const redisClient = await getRedisInstance();
  const queues = await e1.getQueuesAsync(redisClient, requiredConfig);
  expect(
    isEqual(queues, [
      { ns: 'testing', name: 'w123.2.4.5.6' },
      { ns: 'testing', name: 'w123.2.4.5' },
      { ns: 'testing', name: 'w123.2.4' },
    ]),
  ).toBe(true);
});
