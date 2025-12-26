/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import { EventBusRedis } from '../../src/event-bus/index.js';
import { redisConfig } from '../config.js';
import { getRedisInstance } from '../common.js';

type TEvent = {
  e1: (arg: string) => void;
  error: (err: Error) => void;
};

it('EventBus: namespaces', async () => {
  const eventBusAsync = bluebird.promisifyAll(
    new EventBusRedis<TEvent>({ redis: redisConfig }, 'test'),
  );
  await eventBusAsync.runAsync();

  const m1: string[] = [];
  eventBusAsync.on('e1', (message) => {
    m1.push(message);
  });

  const m2: [string, string][] = [];
  const redisClient = await getRedisInstance();
  redisClient.subscribe('test:e1');
  redisClient.on('message', (channel, message) => {
    m2.push([channel, message]);
  });

  eventBusAsync.emit('e1', 'hello');
  await bluebird.delay(5000);

  expect(m1.length).toBe(1);
  expect(m1[0]).toEqual('hello');

  expect(m2.length).toBe(1);
  expect(m2[0]).toEqual(['test:e1', JSON.stringify(['hello'])]);

  await eventBusAsync.shutdownAsync();
});
