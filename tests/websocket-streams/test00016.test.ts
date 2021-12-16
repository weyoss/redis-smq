import {
  getConsumer,
  listenForWebsocketStreamEvents,
  startWebsocketHeartbeatStreamWorker,
  validateTime,
} from '../common';
import { THeartbeatPayload } from '../../types';

test('WebsocketHeartbeatStreamWorker: consumerHeartbeat', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const data = await listenForWebsocketStreamEvents<THeartbeatPayload>(
    `consumerHeartbeat:${consumer.getId()}`,
    startWebsocketHeartbeatStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual(
      expect.arrayContaining(['timestamp', 'data']),
    );
    expect(Object.keys(data[i].payload.data)).toEqual(
      expect.arrayContaining(['ipAddress', 'hostname', 'pid', 'ram', 'cpu']),
    );
  }
});
