import {
  getConsumer,
  getProducer,
  getRedisInstance,
  startStatsAggregator,
  untilConsumerIdle,
} from './common';
import { TAggregatedStats } from '../types';

describe('StatsAggregatorThread: check that stats are aggregated and published', () => {
  test('Case 1', async () => {
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

  test('Case 2', async () => {
    const consumer = getConsumer();
    await consumer.runAsync();

    const producer = getProducer();
    await untilConsumerIdle(consumer);

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

    expect(Object.keys(json.queues)).toEqual(
      expect.arrayContaining(['redis-smq-testing']),
    );

    expect(Object.keys(json.queues['redis-smq-testing'])).toEqual(
      expect.arrayContaining(['test_queue']),
    );

    expect(Object.keys(json.queues['redis-smq-testing']['test_queue'])).toEqual(
      expect.arrayContaining([
        'queueName',
        'namespace',
        'erroredMessages',
        'size',
        'consumers',
        'producers',
      ]),
    );

    expect(
      Object.keys(
        json.queues['redis-smq-testing']['test_queue']['consumers'] ?? {},
      ),
    ).toEqual(expect.arrayContaining([consumer.getId()]));

    const consumers =
      json.queues['redis-smq-testing']['test_queue']['consumers'] ?? {};

    expect(Object.keys(consumers[consumer.getId()])).toEqual(
      expect.arrayContaining([
        'id',
        'namespace',
        'queueName',
        'rates',
        'resources',
      ]),
    );

    expect(Object.keys(consumers[consumer.getId()]['rates'] ?? {})).toEqual(
      expect.arrayContaining(['processing', 'acknowledged', 'unacknowledged']),
    );

    const resources = consumers[consumer.getId()]['resources'] ?? {};

    expect(Object.keys(resources)).toEqual(
      expect.arrayContaining(['ipAddress', 'hostname', 'pid', 'ram', 'cpu']),
    );

    expect(Object.keys(resources['ram'])).toEqual(
      expect.arrayContaining(['usage', 'free', 'total']),
    );

    expect(Object.keys(resources['ram']['usage'])).toEqual(
      expect.arrayContaining([
        'rss',
        'heapTotal',
        'heapUsed',
        'external',
        'arrayBuffers',
      ]),
    );

    expect(Object.keys(resources['cpu'])).toEqual(
      expect.arrayContaining(['percentage', 'user', 'system']),
    );

    const producers =
      json.queues['redis-smq-testing']['test_queue']['producers'] ?? {};

    expect(Object.keys(producers)).toEqual(
      expect.arrayContaining([producer.getId()]),
    );

    expect(Object.keys(producers[producer.getId()])).toEqual(
      expect.arrayContaining(['id', 'namespace', 'queueName', 'rates']),
    );

    expect(Object.keys(producers[producer.getId()]['rates'])).toEqual(
      expect.arrayContaining(['input']),
    );
  });
});
