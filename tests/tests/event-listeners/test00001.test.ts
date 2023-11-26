/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EConsumeMessageDeadLetterCause,
  IEventListener,
  IQueueParams,
  IRedisSMQConfig,
  TEventListenerInitArgs,
} from '../../../types';
import { ICallback } from 'redis-smq-common';
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
import { Configuration } from '../../../src/config/configuration';

const consumerStats: Record<
  string,
  { queue: IQueueParams; event: string; messageId: string }[]
> = {};

class TestConsumerEventListener implements IEventListener {
  init(
    { instanceId, eventProvider }: TEventListenerInitArgs,
    cb: ICallback<void>,
  ) {
    consumerStats[instanceId] = [];
    eventProvider.on(
      events.MESSAGE_ACKNOWLEDGED,
      (messageId: string, queue: IQueueParams) => {
        consumerStats[instanceId].push({
          queue,
          event: events.MESSAGE_ACKNOWLEDGED,
          messageId,
        });
      },
    );
    eventProvider.on(
      events.MESSAGE_DEAD_LETTERED,
      (
        _: EConsumeMessageDeadLetterCause,
        messageId: string,
        queue: IQueueParams,
      ) => {
        consumerStats[instanceId].push({
          queue,
          event: events.MESSAGE_DEAD_LETTERED,
          messageId,
        });
      },
    );
    cb();
  }

  quit(cb: ICallback<void>) {
    cb();
  }
}

test('Consumer event listeners', async () => {
  const cfg: IRedisSMQConfig = {
    ...config,
    eventListeners: {
      consumerEventListeners: [TestConsumerEventListener],
    },
  };

  Configuration.reset();
  Configuration.getSetConfig(cfg);
  Message.setDefaultConsumeOptions({ retryDelay: 0 });

  await createQueue(defaultQueue, false);
  const { messageId: m0, consumer: c0 } =
    await produceAndAcknowledgeMessage(defaultQueue);
  await shutDownBaseInstance(c0);
  const { messageId: m1, consumer: c1 } =
    await produceAndAcknowledgeMessage(defaultQueue);
  await shutDownBaseInstance(c1);
  const anotherQueue = { name: 'another_queue', ns: 'testing' };
  await createQueue(anotherQueue, false);
  const {
    messageId: m2,
    consumer: c2,
    producer: p2,
  } = await produceAndDeadLetterMessage(anotherQueue);
  await shutDownBaseInstance(c2);

  const c3 = getConsumer({ queue: anotherQueue });
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
    messageId: m0,
  });
  expect(consumerStats[c1.getId()][0]).toEqual({
    queue: defaultQueue,
    event: events.MESSAGE_ACKNOWLEDGED,
    messageId: m1,
  });
  expect(consumerStats[c2.getId()].length).toEqual(1);
  expect(consumerStats[c2.getId()][0].queue).toEqual(anotherQueue);
  expect(consumerStats[c2.getId()][0].event).toEqual(
    events.MESSAGE_DEAD_LETTERED,
  );
  expect(consumerStats[c2.getId()][0].messageId).toEqual(m2);

  expect(consumerStats[c3.getId()].length).toEqual(2);
  expect(consumerStats[c3.getId()][0]).toEqual({
    queue: anotherQueue,
    event: events.MESSAGE_ACKNOWLEDGED,
    messageId: m3.getRequiredId(),
  });
  expect(consumerStats[c3.getId()][1]).toEqual({
    queue: anotherQueue,
    event: events.MESSAGE_ACKNOWLEDGED,
    messageId: m4.getRequiredId(),
  });
});
