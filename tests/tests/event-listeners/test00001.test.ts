/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IEventListener, IQueueParams, IRedisSMQConfig } from '../../../types';
import { EventEmitter, ICallback } from 'redis-smq-common';
import { config } from '../../common/config';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
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
import { TRedisSMQEvent } from '../../../types';

const consumerStats: Record<
  string,
  { queue: IQueueParams; event: keyof TRedisSMQEvent; messageId: string }[]
> = {};

class TestConsumerEventListener
  extends EventEmitter<TRedisSMQEvent>
  implements IEventListener
{
  init(cb: ICallback<void>) {
    this.on(
      'messageAcknowledged',
      (
        messageId: string,
        queue: IQueueParams,
        messageHandlerId,
        consumerId,
      ) => {
        consumerStats[consumerId] = consumerStats[consumerId] ?? [];
        consumerStats[consumerId].push({
          queue,
          event: 'messageAcknowledged',
          messageId,
        });
      },
    );
    this.on(
      'messageDeadLettered',
      (
        messageId: string,
        queue: IQueueParams,
        messageHandlerId,
        consumerId,
      ) => {
        consumerStats[consumerId] = consumerStats[consumerId] ?? [];
        consumerStats[consumerId].push({
          queue,
          event: 'messageDeadLettered',
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
    eventListeners: [TestConsumerEventListener],
  };

  Configuration.reset();
  Configuration.getSetConfig(cfg);
  ProducibleMessage.setDefaultConsumeOptions({ retryDelay: 0 });

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

  const m3 = new ProducibleMessage().setQueue(anotherQueue).setBody('MMM');
  const [id3] = await p2.produceAsync(m3);

  const m4 = new ProducibleMessage().setQueue(anotherQueue).setBody('MMM');
  const [id4] = await p2.produceAsync(m4);

  await delay(5000);

  expect(Object.keys(consumerStats)).toEqual([
    c0.getId(),
    c1.getId(),
    c2.getId(),
    c3.getId(),
  ]);
  expect(consumerStats[c0.getId()][0]).toEqual({
    queue: defaultQueue,
    event: 'messageAcknowledged',
    messageId: m0,
  });
  expect(consumerStats[c1.getId()][0]).toEqual({
    queue: defaultQueue,
    event: 'messageAcknowledged',
    messageId: m1,
  });
  expect(consumerStats[c2.getId()].length).toEqual(1);
  expect(consumerStats[c2.getId()][0].queue).toEqual(anotherQueue);
  expect(consumerStats[c2.getId()][0].event).toEqual('messageDeadLettered');
  expect(consumerStats[c2.getId()][0].messageId).toEqual(m2);

  expect(consumerStats[c3.getId()].length).toEqual(2);
  expect(consumerStats[c3.getId()][0]).toEqual({
    queue: anotherQueue,
    event: 'messageAcknowledged',
    messageId: id3,
  });
  expect(consumerStats[c3.getId()][1]).toEqual({
    queue: anotherQueue,
    event: 'messageAcknowledged',
    messageId: id4,
  });
});
