import { IConfig, IEventListener, IEventProvider } from '../../../types';
import { ICallback } from 'redis-smq-common/dist/types';
import { RedisClient } from 'redis-smq-common';
import { config } from '../../common/config';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

const producerStats: Record<string, { event: string; message: Message }[]> = {};

class TestProducerEventListener implements IEventListener {
  constructor(
    redisClient: RedisClient,
    producerId: string,
    eventProvider: IEventProvider,
  ) {
    producerStats[producerId] = [];
    eventProvider.on(events.MESSAGE_PUBLISHED, (msg: Message) => {
      producerStats[producerId].push({
        event: events.MESSAGE_PUBLISHED,
        message: msg,
      });
    });
  }

  quit(cb: ICallback<void>) {
    cb();
  }
}

const cfg: IConfig = {
  ...config,
  eventListeners: {
    producerEventListeners: [TestProducerEventListener],
  },
};

test('Producer event listeners', async () => {
  await createQueue(defaultQueue, false);
  const p0 = await getProducer(cfg);
  const m0 = new Message().setQueue(defaultQueue).setBody(123);
  await p0.produceAsync(m0);
  const m1 = new Message().setQueue(defaultQueue).setBody(123);
  await p0.produceAsync(m1);
  const p1 = await getProducer(cfg);
  const m2 = new Message().setQueue(defaultQueue).setBody(123);
  await p1.produceAsync(m2);
  const m3 = new Message().setQueue(defaultQueue).setBody(123);
  await p1.produceAsync(m3);
  expect(Object.keys(producerStats)).toEqual([p0.getId(), p1.getId()]);
  expect(producerStats[p0.getId()].length).toEqual(2);
  expect(producerStats[p0.getId()][0]).toEqual({
    event: events.MESSAGE_PUBLISHED,
    message: m0,
  });
  expect(producerStats[p0.getId()][1]).toEqual({
    event: events.MESSAGE_PUBLISHED,
    message: m1,
  });
  expect(producerStats[p1.getId()].length).toEqual(2);
  expect(producerStats[p1.getId()][0]).toEqual({
    event: events.MESSAGE_PUBLISHED,
    message: m2,
  });
  expect(producerStats[p1.getId()][1]).toEqual({
    event: events.MESSAGE_PUBLISHED,
    message: m3,
  });
});
