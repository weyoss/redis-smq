/**
 * Re-apply the test-wide runtime defaults.
 *
 * Called from `tests/setup/global.ts` (once per worker) and
 * `tests/setup/per-test.ts` (`beforeEach`, every test). Idempotent — a second
 * call has no effect beyond re-asserting the same values.
 *
 * Four kinds of mutable state are reset:
 *
 *   1. Config manager state (`createConfigManager().updateConfig`)
 *      Tests that exercise audit flags, expiry, and queue size limits write
 *      to the config manager directly. `updateConfig` merges, so a test
 *      that set `messageAudit: false` would otherwise leave audit disabled
 *      for every subsequent test in the same worker.
 *
 *   2. Default message consume options (`setDefaultMessageConsumeOptions`)
 *      Applied to any produced message that doesn't set a field explicitly.
 *      A test that changed the default retry threshold would otherwise
 *      change the behavior of every message produced afterwards.
 *
 *   3. Default consumer options (`setDefaultConsumerOptions`)
 *      Heartbeat TTL and batch settings. `heartbeatTTL` in particular is
 *      read by the crash-recovery path — a test that extended it would
 *      slow every subsequent recovery test.
 *
 *   4. Backoff config (`BackoffConfig.setDefaultConfig`)
 *      Shared with `redis-smq-common`. Controls retry pacing across the
 *      library. `jitter: false` makes retry timing deterministic so tests
 *      can assert on it.
 *
 * All four are reset on every test entry, not on test exit. The invariant
 * is "clean on the way in" — a test that crashes mid-body cannot corrupt
 * the next test's starting state, because the next test resets regardless.
 *
 * Not reset here:
 *   - RedisSMQ initialization. `per-test.ts` calls `RedisSMQ.initialize()`
 *     before this function; initializing twice would throw.
 *   - Redis data. `flushAll` in `per-test.ts` owns that.
 *   - Mock state. `vi.restoreAllMocks()` in `per-test.ts` owns that.
 */

import { BackoffConfig } from 'redis-smq-common';
import { RedisSMQ } from '../../../src/index.js';
import { testConfig } from './test-config.js';

// ---------------------------------------------------------------------------
// Exported defaults
// ---------------------------------------------------------------------------

/**
 * Default message-consume options applied to every produced message that
 * does not set a field explicitly.
 *
 * `retryThreshold: 3` matches the production default and means most tests
 * that produce a message and never consume it successfully will see the
 * message requeued twice before being dead-lettered on the third failure.
 * Tests that want a dead-letter on the first failure set
 * `.setRetryThreshold(0)` on the message directly.
 *
 * `retryDelay: 0` means requeues are immediate, not scheduled. Tests that
 * exercise the delayed-retry path set `.setRetryDelay(N)` on the message.
 *
 * `ttl: 0` and `consumeTimeout: 0` mean "no limit". Tests that exercise
 * expiry set those per-message.
 */
export const TEST_CONSUME_OPTIONS = {
  ttl: 0,
  retryThreshold: 3,
  retryDelay: 0,
  consumeTimeout: 0,
} as const;

/**
 * Default consumer options.
 *
 * `heartbeatTTL: 3_000` is deliberately short so crash-recovery tests
 * (`reap-consumers.worker`, `consumer-crash-recovery`) complete within a
 * reasonable test window. Production uses a much longer TTL. Tests that
 * need to observe a consumer being declared dead wait
 * `heartbeatTTL + margin`; exporting this constant lets them reference the
 * value rather than hardcoding 3000.
 *
 * Batching is enabled with a small batch size so tests exercise the
 * batched acknowledgement path. `batchTimeoutMs: 1000` bounds how long a
 * lone acknowledgement can sit in a batch before it flushes — short enough
 * that an `untilMessageAcknowledged` awaiter resolves promptly.
 */
export const TEST_CONSUMER_OPTIONS = {
  heartbeatTTL: 3_000,
  batchAcks: {
    enabled: true,
    batchSize: 100,
    batchTimeoutMs: 1000,
  },
  batchUnacks: {
    enabled: true,
    batchSize: 100,
    batchTimeoutMs: 1000,
  },
} as const;

/**
 * Backoff config used by the library's internal retry loops.
 *
 * `jitter: false` is the important one. Retry timing is otherwise
 * randomized, and tests that assert on retry spacing (`retry-delay.test.ts`)
 * need deterministic pacing. `baseDelay` and `maxDelay` are chosen to be
 * short enough that a retry happens well within a test timeout, but long
 * enough that the "delay between attempts" is observable.
 */
export const TEST_BACKOFF_CONFIG = {
  baseDelay: 1000,
  maxDelay: 3_000,
  jitter: false,
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply the test-wide defaults. Caller must have already called
 * `RedisSMQ.initialize()` — this function does not initialize.
 *
 * Safe to call more than once. Each operation is a set, not a mutation of
 * existing state, so repeating the call is a no-op beyond the round-trips.
 *
 * Errors are not swallowed. If any of the four resets fails, test isolation
 * is broken and every subsequent test in the worker will run against
 * inconsistent state. Failing loudly at the point of the reset makes the
 * cause obvious; swallowing would push the failure into an unrelated test
 * with a confusing symptom.
 */
export async function applyTestDefaults(): Promise<void> {
  // 1. Config manager state.
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig(testConfig);

  // 2. Default message consume options.
  RedisSMQ.setDefaultMessageConsumeOptions(TEST_CONSUME_OPTIONS);

  // 3. Default consumer options.
  RedisSMQ.setDefaultConsumerOptions(TEST_CONSUMER_OPTIONS);

  // 4. Backoff config (shared with redis-smq-common).
  BackoffConfig.setDefaultConfig(TEST_BACKOFF_CONFIG);
}
