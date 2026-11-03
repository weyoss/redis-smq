/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import { EventBusRedis } from '../../../src/event-bus/index.js';
import { redisConfig } from '../../helpers/config.js';
import { getRedisInstance } from '../../helpers/common.js';

type TEvent = {
  e1: (arg: string) => void;
  error: (err: Error) => void;
};

/**
 * Poll until `predicate()` is true, or throw after `timeoutMs`.
 * Resolves as soon as the condition holds — no fixed wait.
 */
async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2000,
  intervalMs = 10,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe('EventBusRedis: namespaces', () => {
  it('publishes to the namespaced channel and delivers locally', async () => {
    const bus = bluebird.promisifyAll(
      new EventBusRedis<TEvent>({ redis: redisConfig }, 'test'),
    );
    await bus.runAsync();

    const localMessages: string[] = [];
    bus.on('e1', (message) => localMessages.push(message));

    const redisClient = await getRedisInstance();
    const rawMessages: [string, string][] = [];
    redisClient.subscribe('test:e1');
    redisClient.on('message', (channel, message) => {
      rawMessages.push([channel, message]);
    });

    // Give the raw subscription a moment to register before publishing.
    await new Promise((r) => setTimeout(r, 50));

    bus.emit('e1', 'hello');
    await waitFor(() => localMessages.length === 1 && rawMessages.length === 1);

    expect(localMessages).toEqual(['hello']);
    expect(rawMessages).toEqual([['test:e1', JSON.stringify(['hello'])]]);

    await bus.shutdownAsync();
  });
});
