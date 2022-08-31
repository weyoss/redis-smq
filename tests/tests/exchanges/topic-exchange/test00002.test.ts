import { TopicExchange } from '../../../../src/lib/exchange/topic.exchange';
import { requiredConfig } from '../../../common/config';
import { promisifyAll } from 'bluebird';
import { isEqual } from '../../../common/util';

test('TopicExchange: matching queues', async () => {
  const e1 = promisifyAll(new TopicExchange('w123.2.4'));
  const queues = await e1.matchQueuesAsync(requiredConfig, [
    { ns: 'testing', name: 'w123.2.4.5' },
    { ns: 'testing', name: 'w123.2.4.5.6' },
    { ns: 'beta', name: 'w123.2' },
    { ns: 'testing', name: 'w123.2' },
    { ns: 'testing', name: 'w123.2.4' },
  ]);
  expect(
    isEqual(queues, [
      { ns: 'testing', name: 'w123.2.4.5' },
      { ns: 'testing', name: 'w123.2.4.5.6' },
      { ns: 'testing', name: 'w123.2.4' },
    ]),
  ).toBe(true);
  const e2 = promisifyAll(
    new TopicExchange({ ns: 'my_app', topic: 'w123.2.4' }),
  );
  const queues2 = await e2.matchQueuesAsync(requiredConfig, [
    { ns: 'my_app', name: 'w123.2.4.5' },
    { ns: 'testing', name: 'w123.2.4.5.6' },
    { ns: 'beta', name: 'w123.2' },
    { ns: 'my_app', name: 'w123.2' },
    { ns: 'my_app', name: 'w123.2.4' },
  ]);
  expect(
    isEqual(queues2, [
      { ns: 'my_app', name: 'w123.2.4.5' },
      { ns: 'my_app', name: 'w123.2.4' },
    ]),
  ).toBe(true);
});
