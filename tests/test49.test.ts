import { getRedisInstance, startStatsAggregator } from './common';
import { TAggregatedStats } from '../types';

test('Check that stats are aggregated and published: Case 1', async () => {
  await startStatsAggregator();

  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe('stats');

  const json = await new Promise<TAggregatedStats>((resolve, reject) => {
    subscribeClient.on('message', (channel, message) => {
      if (typeof message === 'string') {
        const json: TAggregatedStats = JSON.parse(message);
        resolve(json);
      } else reject(new Error('Expected a message payload'));
    });
  });

  expect(Object.keys(json)).toEqual(
    expect.arrayContaining(['rates', 'queues']),
  );

  expect(Object.keys(json.rates)).toEqual(
    expect.arrayContaining([
      'processing',
      'acknowledged',
      'unacknowledged',
      'input',
    ]),
  );
  expect(json.rates.processing).toBe(0);
  expect(json.rates.acknowledged).toBe(0);
  expect(json.rates.unacknowledged).toBe(0);
  expect(json.rates.input).toBe(0);
});
