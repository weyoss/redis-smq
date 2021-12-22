import {
  getProducer,
  listenForWebsocketStreamEvents,
  startWebsocketOnlineStreamWorker,
  validateTime,
} from '../common';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';
import { THeartbeatRegistryPayload } from '../../types';
import { delay } from 'bluebird';

test('WebsocketOnlineStreamWorker: streamQueueOnlineProducers', async () => {
  const producer = getProducer();
  await delay(5000);

  const data = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamQueueOnlineProducers:${redisKeys.getNamespace()}:${producer.getQueueName()}`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual([producer.getId()]);
    const payload: THeartbeatRegistryPayload = JSON.parse(
      data[i].payload[producer.getId()],
    );
    expect(Object.keys(payload)).toEqual([
      'ipAddress',
      'hostname',
      'pid',
      'createdAt',
    ]);
  }
});
