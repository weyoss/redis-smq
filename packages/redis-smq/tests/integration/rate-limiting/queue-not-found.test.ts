/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { errors, RedisSMQ } from '../../../src/index.js';

/**
 * Integration tests for the "queue does not exist" rejection across
 * the rate-limit manager's public API.
 *
 * A rate limit is a property of a queue. Every rate-limit operation —
 * read or write — verifies the queue exists before touching Redis
 * state. A limit on a nonexistent queue would have no consumer to
 * enforce it against, and the read operations would return a
 * meaningless result.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * A valid-looking rate-limit argument. RedisSMQ rejects on the
 * missing queue *before* it uses the argument's values, so the numbers
 * only need to satisfy the shape — the same values used throughout the
 * sibling files, so a reader comparing files sees consistent numbers.
 */
const RATE_LIMIT = { limit: 5, interval: 1000 } as const;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Generate a queue name that provably does not exist.
 *
 * The `uniqueQueue` helper would also produce a unique name, but it is
 * meant for queues that *will* be created. Using it here would imply
 * the queue is intended to exist. A `Date.now()` suffix makes the
 * "never created" intent explicit at the call site and matches the
 * convention used in the other "missing queue" tests elsewhere in the
 * suite.
 */
function missingQueue(): { ns: string; name: string } {
  return {
    ns: 'testing',
    name: `never-created-${Date.now()}`,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue rate limit — missing queue', () => {
  // -------------------------------------------------------------------------
  // Read operations
  // -------------------------------------------------------------------------

  describe('read operations', () => {
    it('get rejects with QueueNotFoundError', async () => {
      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await expect(rateLimit.get(missingQueue())).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });

    it('hasExceeded rejects with QueueNotFoundError', async () => {
      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await expect(
        rateLimit.hasExceeded(missingQueue(), RATE_LIMIT),
      ).rejects.toThrow(errors.QueueNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Write operations
  // -------------------------------------------------------------------------

  describe('write operations', () => {
    it('set rejects with QueueNotFoundError', async () => {
      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await expect(rateLimit.set(missingQueue(), RATE_LIMIT)).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });

    it('clear rejects with QueueNotFoundError', async () => {
      const rateLimit = RedisSMQ.createQueueRateLimitManager();

      await expect(rateLimit.clear(missingQueue())).rejects.toThrow(
        errors.QueueNotFoundError,
      );
    });
  });
});
