/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { ERedisConfigClient } from 'redis-smq-common';
import { RedisSMQ } from '../../../src/index.js';
import { redisConfig } from '../../helpers/config/test-config.js';

/**
 * Integration tests for RedisSMQ's top-level lifecycle.
 *
 * `RedisSMQ` is RedisSMQ's process-wide entry point. Its
 * `initialize` / `shutdown` pair follows the same `Runnable` contract
 * every other framework component does, with one addition that is
 * specific to the top-level object: a *failed* `initialize` must
 * reset the internal state machine so a subsequent `initialize` can
 * be attempted.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The unreachable Redis config used by the failed-initialize test.
 *
 * See the file header for why the host is a TEST-NET address and why
 * the `retryStrategy` setting is what makes the failure fast.
 *
 * `maxRetriesPerRequest: 0` and `enableOfflineQueue: false` are
 * defense-in-depth: even if the connection attempt somehow succeeded
 * (it will not), the first command would fail immediately rather
 * than queue behind an offline connection.
 */
const UNREACHABLE_REDIS_CONFIG = {
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: 'nope',
    connectTimeout: 500,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
    enableOfflineQueue: false,
  },
} as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RedisSMQ lifecycle', () => {
  // -------------------------------------------------------------------------
  // Failed initialize, then retry
  // -------------------------------------------------------------------------

  it('allows a re-initialize after a failed attempt', async () => {
    // The test starts from a running RedisSMQ: the per-test setup in
    // `tests/setup/per-test.ts` calls `RedisSMQ.initialize(redisConfig)`
    // in its `beforeEach`. Shut it down first so the failed
    // `initialize` below is exercised from a fully-down state — which
    // is the state a caller would be in on the first attempt of a
    // fresh process.
    await RedisSMQ.shutdown();

    // Sanity: RedisSMQ is down before the failed attempt. This
    // is what makes the "state machine reset" assertion below
    // meaningful — if RedisSMQ were somehow still running, the
    // rejected `initialize` would be indistinguishable from an
    // "Already initialized" rejection.
    expect(RedisSMQ.isRunning()).toBe(false);

    // The failed initialize. RedisSMQ attempts to connect to an
    // unreachable host and rejects. The specific error class is not
    // asserted — RedisSMQ may surface a Redis-level error, a
    // pool-level error, or its own wrapper, depending on where the
    // failure occurs, and none of those are the contract under test.
    await expect(
      RedisSMQ.initialize(UNREACHABLE_REDIS_CONFIG),
    ).rejects.toThrow();

    // The load-bearing assertion: the state machine reset. A caller
    // who catches the rejection from a failed `initialize` should
    // find RedisSMQ in a state where the next `initialize` is
    // permitted. If RedisSMQ left itself "running" (or in any
    // state other than fully-down) after the failure, this would be
    // `true`, and the next call would fail with "Already
    // initialized" instead of re-attempting the connection.
    expect(RedisSMQ.isRunning()).toBe(false);

    // The retry with a valid config. RedisSMQ initializes
    // normally.
    await RedisSMQ.initialize(redisConfig);

    expect(RedisSMQ.isRunning()).toBe(true);

    // Explicit cleanup. The afterEach in `per-test.ts` calls
    // `shutdown()` again, which is idempotent on an already-down
    // framework — the explicit call here makes the test's own
    // lifecycle visible rather than relying on the harness.
    await RedisSMQ.shutdown();
  });

  // -------------------------------------------------------------------------
  // Clean restart
  // -------------------------------------------------------------------------

  it('allows a clean re-initialize after a successful shutdown', async () => {
    await RedisSMQ.shutdown();
    expect(RedisSMQ.isRunning()).toBe(false);

    await RedisSMQ.initialize(redisConfig);
    expect(RedisSMQ.isRunning()).toBe(true);

    await RedisSMQ.shutdown();
    expect(RedisSMQ.isRunning()).toBe(false);

    // The re-initialize. Same config, same process, fresh framework.
    await RedisSMQ.initialize(redisConfig);
    expect(RedisSMQ.isRunning()).toBe(true);

    await RedisSMQ.shutdown();
  });
});
