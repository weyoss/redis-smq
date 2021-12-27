import {
  getConsumer,
  listenForWebsocketStreamEvents,
  validateTime,
} from '../common';

test('WebsocketRateStreamWorker: streamQueueUnacknowledged', async () => {
  const consumer = getConsumer();
  const queue = consumer.getQueue();
  await consumer.runAsync();

  const data = await listenForWebsocketStreamEvents(
    `streamQueueUnacknowledged:${queue.ns}:${queue.name}`,
  );

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(data[i].payload.length).toBe(60);
    expect(data[i].payload.find((i) => i.value !== 0)).toBeUndefined();
  }
});
