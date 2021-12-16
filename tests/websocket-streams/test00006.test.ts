import { getProducer, listenForWebsocketStreamEvents } from '../common';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';

test('WebsocketRateStreamWorker: queuePublished', async () => {
  const producer = getProducer();

  const data = await listenForWebsocketStreamEvents(
    `queuePublished:${redisKeys.getNamespace()}:${producer.getQueueName()}`,
  );

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(diff).toBe(i);
    expect(data[i].payload.length).toBe(60);
    expect(data[i].payload.find((i) => i.value !== 0)).toBeUndefined();
  }
});
