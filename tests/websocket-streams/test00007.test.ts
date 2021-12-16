import { listenForWebsocketStreamEvents } from '../common';

test('WebsocketRateStreamWorker: globalAcknowledged', async () => {
  const data = await listenForWebsocketStreamEvents(`globalAcknowledged`);

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(diff).toBe(i);
    expect(data[i].payload.length).toBe(60);
    expect(data[i].payload.find((i) => i.value !== 0)).toBeUndefined();
  }
});
