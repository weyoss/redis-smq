import {
  getProducer,
  listenForWebsocketStreamEvents,
  startWebsocketOnlineStreamWorker,
  validateTime,
} from '../common';
import { delay } from 'bluebird';

test('WebsocketOnlineStreamWorker: streamOnlineQueueProducers/case 2', async () => {
  const producer = getProducer();
  const queue = producer.getQueue();
  await delay(5000);

  const data = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamOnlineQueueProducers:${queue.ns}:${queue.name}`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(Object.keys(data[i].payload)).toEqual([producer.getId()]);
  }

  await producer.shutdownAsync();

  const data2 = await listenForWebsocketStreamEvents<Record<string, string>>(
    `streamOnlineQueueConsumers:${queue.ns}:${queue.name}`,
    startWebsocketOnlineStreamWorker,
  );
  for (let i = 0; i < data2.length; i += 1) {
    const diff = data2[i].ts - data2[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(data2[i].payload).toEqual({});
  }
});
