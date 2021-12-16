import { getConsumer, listenForWebsocketStreamEvents } from '../common';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';

test('WebsocketRateStreamWorker: queueProcessing', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const data = await listenForWebsocketStreamEvents(
    `queueProcessing:${redisKeys.getNamespace()}:${consumer.getQueueName()}`,
  );

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(diff).toBe(i);
    expect(data[i].timeSeries.length).toBe(60);
    expect(data[i].timeSeries.find((i) => i.value !== 0)).toBeUndefined();
  }
});
