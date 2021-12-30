import {
  listenForWebsocketStreamEvents,
  startWebsocketOnlineStreamWorker,
  validateTime,
} from '../common';
import { delay, promisifyAll } from 'bluebird';
import { MultiQueueProducer } from '../../src/multi-queue-producer';
import { config } from '../config';
import { THeartbeatRegistryPayload } from '../../types';

test('WebsocketOnlineStreamWorker: streamOnlineMultiQueueProducers', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  await delay(5000);

  const data = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamOnlineMultiQueueProducers`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual([mProducer.getId()]);
    const payload: THeartbeatRegistryPayload = JSON.parse(
      data[i].payload[mProducer.getId()],
    );
    expect(Object.keys(payload)).toEqual([
      'ipAddress',
      'hostname',
      'pid',
      'createdAt',
    ]);
  }
  await mProducer.shutdownAsync();
});
