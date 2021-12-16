import { getProducer, listenForWebsocketStreamEvents } from '../common';

test('WebsocketRateStreamWorker: producerPublished', async () => {
  const producer = getProducer();

  const data = await listenForWebsocketStreamEvents(
    `producerPublished:${producer.getId()}`,
  );

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(diff).toBe(i);
    expect(data[i].timeSeries.length).toBe(60);
    expect(data[i].timeSeries.find((i) => i.value !== 0)).toBeUndefined();
  }
});
