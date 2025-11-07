/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { ProducibleMessage } from '../../../src/index.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Event bus: case 2', async () => {
  const eventBus = await getEventBus();
  const producerStats: Record<string, string[]> = {};
  eventBus.on(
    'producer.messagePublished',
    (messageId: string, queue, producerId) => {
      producerStats[producerId] = producerStats[producerId] ?? [];
      producerStats[producerId].push(messageId);
    },
  );
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const p0 = getProducer();
  await p0.runAsync();
  const m0 = new ProducibleMessage().setQueue(getDefaultQueue()).setBody(123);
  const [id0] = await p0.produceAsync(m0);
  const m1 = new ProducibleMessage().setQueue(getDefaultQueue()).setBody(123);
  const [id1] = await p0.produceAsync(m1);
  const p1 = getProducer();
  await p1.runAsync();
  const m2 = new ProducibleMessage().setQueue(getDefaultQueue()).setBody(123);
  const [id2] = await p1.produceAsync(m2);
  const m3 = new ProducibleMessage().setQueue(getDefaultQueue()).setBody(123);
  const [id3] = await p1.produceAsync(m3);

  await bluebird.delay(5000);

  expect(Object.keys(producerStats)).toEqual([p0.getId(), p1.getId()]);

  expect(producerStats[p0.getId()].length).toEqual(2);
  expect(producerStats[p0.getId()][0]).toEqual(id0);
  expect(producerStats[p0.getId()][1]).toEqual(id1);

  expect(producerStats[p1.getId()].length).toEqual(2);
  expect(producerStats[p1.getId()][0]).toEqual(id2);
  expect(producerStats[p1.getId()][1]).toEqual(id3);
});
