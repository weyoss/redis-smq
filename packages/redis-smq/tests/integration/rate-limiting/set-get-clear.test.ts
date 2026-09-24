/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueType, errors, RedisSMQ } from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for the queue rate-limit CRUD API.
 *
 * `QueueRateLimit` provides three operations on a queue's rate limit:
 *
 *   - `set(queue, {limit, interval})` — write the limit.
 *   - `get(queue)` — read the current limit, or `null` if none is set.
 *   - `clear(queue)` — remove the limit.
 *
 * The rate limit is stored as a pair of Redis keys under the queue's
 * rate-limit namespace. All three operations are synchronous with
 * respect to the Redis write — the returned promise resolves once the
 * write has landed — so a `get` immediately after a `set` or `clear`
 * observes the new state without polling.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue rate limit — CRUD', () => {
  // -------------------------------------------------------------------------
  // get — baseline
  // -------------------------------------------------------------------------

  describe('get', () => {
    it('returns null on a freshly created queue', async () => {
      const queue = uniqueQueue('rl-fresh');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();
      expect(await rateLimit.get(queue)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // set / get round trip
  // -------------------------------------------------------------------------

  describe('set / get', () => {
    it('round-trips a value through set and get', async () => {
      const queue = uniqueQueue('rl-roundtrip');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await rateLimit.set(queue, { limit: 5, interval: 1000 });

      expect(await rateLimit.get(queue)).toEqual({
        limit: 5,
        interval: 1000,
      });
    });

    it('overwrites a previous value on a second set', async () => {
      const queue = uniqueQueue('rl-overwrite');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await rateLimit.set(queue, { limit: 5, interval: 1000 });
      await rateLimit.set(queue, { limit: 10, interval: 2000 });

      expect(await rateLimit.get(queue)).toEqual({
        limit: 10,
        interval: 2000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // clear
  // -------------------------------------------------------------------------

  describe('clear', () => {
    it('removes a previously set limit', async () => {
      const queue = uniqueQueue('rl-clear');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await rateLimit.set(queue, { limit: 5, interval: 1000 });
      // Pre-state: the limit is present.
      expect(await rateLimit.get(queue)).toEqual({
        limit: 5,
        interval: 1000,
      });

      await rateLimit.clear(queue);

      // Post-state: the limit is gone.
      expect(await rateLimit.get(queue)).toBeNull();
    });

    it('is a no-op on a queue with no limit', async () => {
      const queue = uniqueQueue('rl-clear-noop');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      // Pre-state: no limit set.
      expect(await rateLimit.get(queue)).toBeNull();

      // The clear resolves without error — the bare `await` is the
      // assertion.
      await rateLimit.clear(queue);

      // Post-state: still no limit.
      expect(await rateLimit.get(queue)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Validation — limit
  // -------------------------------------------------------------------------

  describe('validation — limit', () => {
    it.each<[string, number]>([
      ['zero', 0],
      ['a negative value', -1],
    ])('rejects a set with %s as the limit', async (_label, limit) => {
      const queue = uniqueQueue('rl-bad-limit');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await expect(
        rateLimit.set(queue, { limit, interval: 1000 }),
      ).rejects.toThrow(errors.InvalidRateLimitValueError);
    });

    it('leaves the state unchanged after a rejected set', async () => {
      const queue = uniqueQueue('rl-bad-limit-no-mutate');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await rateLimit.set(queue, { limit: 5, interval: 1000 });

      await expect(
        rateLimit.set(queue, { limit: 0, interval: 1000 }),
      ).rejects.toThrow(errors.InvalidRateLimitValueError);

      // The original value is intact.
      expect(await rateLimit.get(queue)).toEqual({
        limit: 5,
        interval: 1000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Validation — interval
  // -------------------------------------------------------------------------

  describe('validation — interval', () => {
    it.each<[string, number]>([
      ['zero', 0],
      ['a negative value', -1],
    ])('rejects a set with %s as the interval', async (_label, interval) => {
      const queue = uniqueQueue('rl-bad-interval');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await expect(
        rateLimit.set(queue, { limit: 5, interval }),
      ).rejects.toThrow(errors.InvalidRateLimitIntervalError);
    });
  });

  // -------------------------------------------------------------------------
  // Precondition — queue must exist
  // -------------------------------------------------------------------------

  describe('precondition', () => {
    it('rejects a set on a queue that does not exist', async () => {
      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      const missingQueue = {
        ns: 'testing',
        name: `never-created-${Date.now()}`,
      };

      await expect(
        rateLimit.set(missingQueue, { limit: 5, interval: 1000 }),
      ).rejects.toThrow(errors.QueueNotFoundError);
    });
  });
});
