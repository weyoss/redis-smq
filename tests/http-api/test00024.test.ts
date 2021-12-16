import {
  getConsumer,
  getProducer,
  getRedisInstance,
  startWebsocketRateStreamWorker,
  untilConsumerIdle,
} from '../common';
import { TTimeSeriesRange } from '../../types';
import { delay } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';

test('WebsocketRateStreamWorker: Case 1', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const producer = getProducer();
  await untilConsumerIdle(consumer);

  await startWebsocketRateStreamWorker();

  const subscribeClient = await getRedisInstance();
  subscribeClient.subscribe(
    `queueAcknowledged:${redisKeys.getNamespace()}:${consumer.getQueueName()}`,
  );

  const data: { ts: number; timeSeries: TTimeSeriesRange }[] = [];
  subscribeClient.on('message', (channel, message) => {
    if (typeof message === 'string') {
      const json: TTimeSeriesRange = JSON.parse(message);
      data.push({ ts: Math.ceil(Date.now() / 1000), timeSeries: json });
    } else throw new Error('Expected a message payload');
  });

  for (; true; ) {
    if (data.length === 5) break;
    else await delay(500);
  }

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(diff).toBe(i);
    expect(data[i].timeSeries.length).toBe(60);
    expect(data[i].timeSeries.find((i) => i.value !== 0)).toBeUndefined();
  }
});
