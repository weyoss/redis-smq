import {
  defaultQueue,
  getConsumer,
  listenForWebsocketStreamEvents,
  startWebsocketOnlineStreamWorker,
  validateTime,
} from '../common';
import { TConsumerInfo } from '../../types';

test('WebsocketOnlineStreamWorker: streamOnlineQueueConsumers/case 1', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const data = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamOnlineQueueConsumers:${defaultQueue.ns}:${defaultQueue.name}`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual([consumer.getId()]);
    const payload: TConsumerInfo = JSON.parse(
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
