import {
  getConsumer,
  listenForWebsocketStreamEvents,
  startWebsocketOnlineStreamWorker,
  validateTime,
} from '../common';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';
import { THeartbeatRegistryPayload } from '../../types';

test('WebsocketOnlineStreamWorker: streamQueueOnlineConsumers/case 1', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const data = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamQueueOnlineConsumers:${redisKeys.getNamespace()}:${consumer.getQueueName()}`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual([consumer.getId()]);
    const payload: THeartbeatRegistryPayload = JSON.parse(
      data[i].payload[consumer.getId()],
    );
    expect(Object.keys(payload)).toEqual([
      'ipAddress',
      'hostname',
      'pid',
      'createdAt',
    ]);
  }
});
