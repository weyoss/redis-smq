import { listenForWebsocketStreamEvents, validateTime } from '../common';
import { promisifyAll } from 'bluebird';
import { MultiQueueProducer } from '../../src/multi-queue-producer';
import { config } from '../config';

test('WebsocketRateStreamWorker: streamMultiQueueProducerPublished', async () => {
  const mProducer = promisifyAll(new MultiQueueProducer(config));
  const data = await listenForWebsocketStreamEvents(
    `streamMultiQueueProducerPublished:${mProducer.getId()}`,
  );
  for (let i = 0; i < data.length; i += 1) {
    const diff = data[i].ts - data[0].ts;
    expect(validateTime(diff, 1000 * i)).toBe(true);
    expect(data[i].payload.length).toBe(60);
    expect(data[i].payload.find((i) => i.value !== 0)).toBeUndefined();
  }
  await mProducer.shutdownAsync();
});
