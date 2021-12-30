import {
  listenForWebsocketStreamEvents,
  startWebsocketHeartbeatStreamWorker,
  validateTime,
} from '../common';
import { promisifyAll } from 'bluebird';
import { MultiQueueProducer } from '../../src/multi-queue-producer';
import { config } from '../config';
import { THeartbeatPayload } from '../../types';

test('WebsocketHeartbeatStreamWorker: streamMultiQueueProducerHeartbeat', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  const data = await listenForWebsocketStreamEvents<THeartbeatPayload>(
    `streamMultiQueueProducerHeartbeat:${mProducer.getId()}`,
    startWebsocketHeartbeatStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual(
      expect.arrayContaining(['timestamp', 'data']),
    );
    expect(Object.keys(data[i].payload.data)).toEqual(
      expect.arrayContaining(['ram', 'cpu']),
    );
  }
  await mProducer.shutdownAsync();
});
