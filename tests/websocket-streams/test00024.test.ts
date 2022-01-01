import {
  getConsumer,
  getProducer,
  listenForWebsocketStreamEvents,
  startWebsocketHeartbeatStreamWorker,
  validateTime,
} from '../common';
import { TWebsocketHeartbeatOnlineIdsStreamPayload } from '../../types';
import { delay, promisifyAll } from 'bluebird';
import { MultiQueueProducer } from '../../src/multi-queue-producer';
import { config } from '../config';

test('WebsocketHeartbeatStreamWorker: streamHeartbeatOnlineIds', async () => {
  const consumer = getConsumer();
  await consumer.runAsync();

  const producer = getProducer();
  await delay(5000);

  const mProducer = promisifyAll(new MultiQueueProducer(config));
  await delay(5000);

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
      producers: [producer.getId()],
      multiQueueProducers: [mProducer.getId()],
    });
  }
  await mProducer.shutdownAsync();
});
