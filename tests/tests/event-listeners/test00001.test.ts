import {
  IConfig,
  IEventListener,
  TEventListenerInitArgs,
  TQueueParams,
} from '../../../types';
import { ICallback } from 'redis-smq-common/dist/types';
import { config } from '../../common/config';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming';
import { delay } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { shutDownBaseInstance } from '../../common/base-instance';

const consumerStats: Record<
  string,
  { queue: TQueueParams; event: string; message: Message }[]
> = {};

class TestConsumerEventListener implements IEventListener {
  init(
    { instanceId, eventProvider }: TEventListenerInitArgs,
    cb: ICallback<void>,
  ) {
    consumerStats[instanceId] = [];
    eventProvider.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
      consumerStats[instanceId].push({
        queue: msg.getRequiredQueue(),
        event: events.MESSAGE_ACKNOWLEDGED,
        message: msg,
      });
    });
    eventProvider.on(events.MESSAGE_DEAD_LETTERED, (msg: Message) => {
      consumerStats[instanceId].push({
        queue: msg.getRequiredQueue(),
        event: events.MESSAGE_DEAD_LETTERED,
        message: msg,
      });
    });
    cb();
  }

  quit(cb: ICallback<void>) {
    cb();
  }
}

const cfg: IConfig = {
  ...config,
  eventListeners: {
    consumerEventListeners: [TestConsumerEventListener],
  },
};

test('Consumer event listeners', async () => {
  await createQueue(defaultQueue, false);
  const { message: m0, consumer: c0 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );
  await shutDownBaseInstance(c0);
  const { message: m1, consumer: c1 } = await produceAndAcknowledgeMessage(
    defaultQueue,
    cfg,
  );
  await shutDownBaseInstance(c1);
  const anotherQueue = { name: 'another_queue', ns: 'testing' };
  await createQueue(anotherQueue, false);
  const {
    message: m2,
    consumer: c2,
    producer: p2,
  } = await produceAndDeadLetterMessage(anotherQueue, cfg);
  await shutDownBaseInstance(c2);

  const c3 = getConsumer({ queue: anotherQueue, cfg });
  await c3.runAsync();

  const m3 = new Message().setQueue(anotherQueue).setBody('MMM');
  await p2.produceAsync(m3);

  const m4 = new Message().setQueue(anotherQueue).setBody('MMM');
  await p2.produceAsync(m4);

  await delay(5000);

  expect(Object.keys(consumerStats)).toEqual([
    c0.getId(),
    c1.getId(),
    c2.getId(),
    c3.getId(),
  ]);
  expect(consumerStats[c0.getId()][0]).toEqual({
    queue: defaultQueue,
    event: events.MESSAGE_ACKNOWLEDGED,
    message: m0,
  });
  expect(consumerStats[c1.getId()][0]).toEqual({
    queue: defaultQueue,
    event: events.MESSAGE_ACKNOWLEDGED,
    message: m1,
  });
  expect(consumerStats[c2.getId()].length).toEqual(1);
  expect(consumerStats[c2.getId()][0].queue).toEqual(anotherQueue);
  expect(consumerStats[c2.getId()][0].event).toEqual(
    events.MESSAGE_DEAD_LETTERED,
  );
  expect(consumerStats[c2.getId()][0].message.getId()).toEqual(m2.getId());

  expect(consumerStats[c3.getId()].length).toEqual(2);
  expect(consumerStats[c3.getId()][0]).toEqual({
    queue: anotherQueue,
    event: events.MESSAGE_ACKNOWLEDGED,
    message: m3,
  });
  expect(consumerStats[c3.getId()][1]).toEqual({
    queue: anotherQueue,
    event: events.MESSAGE_ACKNOWLEDGED,
    message: m4,
  });
});
