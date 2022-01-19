import {
  getConsumer,
  listenForWebsocketStreamEvents,
  startWebsocketHeartbeatStreamWorker,
  validateTime,
} from '../common';
import { TWebsocketHeartbeatOnlineIdsStreamPayload } from '../../types';

test('WebsocketHeartbeatStreamWorker: streamHeartbeatOnlineIds', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const data =
    await listenForWebsocketStreamEvents<TWebsocketHeartbeatOnlineIdsStreamPayload>(
      `streamHeartbeatOnlineIds`,
      startWebsocketHeartbeatStreamWorker,
    );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(data[i].payload).toEqual({
      consumers: [consumer.getId()],
    });
  }
});
