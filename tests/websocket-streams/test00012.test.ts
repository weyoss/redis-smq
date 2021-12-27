import {
  getConsumer,
  listenForWebsocketStreamEvents,
  validateTime,
} from '../common';

test('WebsocketRateStreamWorker: streamConsumerDeadLettered', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const data = await listenForWebsocketStreamEvents(
    `streamConsumerDeadLettered:${consumer.getId()}`,
  );

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(data[i].payload.length).toBe(60);
    expect(data[i].payload.find((i) => i.value !== 0)).toBeUndefined();
  }
});
