import { listenForWebsocketStreamEvents } from '../common';

test('WebsocketRateStreamWorker: globalProcessing', async () => {
  const data = await listenForWebsocketStreamEvents(`globalProcessing`);

  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(diff).toBe(i);
    expect(data[i].timeSeries.length).toBe(60);
    expect(data[i].timeSeries.find((i) => i.value !== 0)).toBeUndefined();
  }
});
