/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { afterEach, beforeEach, vi } from 'vitest';
import { RedisSMQ } from '../../src/index.js';
import { redisConfig } from '../helpers/config/test-config.js';
import { applyTestDefaults } from '../helpers/config/test-defaults.js';
import { flushAll } from '../helpers/redis/flush.js';
import { shutdownAllConsumers } from '../helpers/factories/consumer.js';
import { shutdownAllProducers } from '../helpers/factories/producer.js';
import { stopAllScheduleWorkers } from '../helpers/workers/schedule-worker.js';

/**
 * Per-test hooks. Imported by `vitest.setup.ts`.
 *
 * Each test gets a clean framework: mocks reset, Redis flushed,
 * RedisSMQ initialized with the test defaults. Teardown runs in the
 * reverse order.
 */

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();

  await flushAll(redisConfig);
  await RedisSMQ.initialize(redisConfig);
  await applyTestDefaults();

  // // eslint-disable-next-line
  // const handles = (process as any)._getActiveHandles?.() ?? [];
  // const children = handles.filter(
  //   // eslint-disable-next-line
  //   (h: any) => h?.constructor?.name === 'ChildProcess',
  // );
  // if (children.length > 0) {
  //   console.error(
  //     `[per-test] ${children.length} ChildProcess handle(s) active after initialize`,
  //   );
  //   for (const c of children) {
  //     console.error(`  pid=${c.pid} killed=${c.killed}`);
  //   }
  // }
});

afterEach(async () => {
  try {
    await stopAllScheduleWorkers();
    await shutdownAllConsumers();
    await shutdownAllProducers();
  } finally {
    await RedisSMQ.shutdown();
  }
});

// ---------------------------------------------------------------------------
// Async error surfacing
// ---------------------------------------------------------------------------

/**
 * Errors that are known benign artifacts of the test lifecycle and
 * should not fail the run.
 *
 * Each entry corresponds to a race RedisSMQ exhibits when its
 * timer-driven components are still shutting down while the
 * surrounding context tears the connection pool out from under them.
 * The race cannot affect any test result — by the time the exception
 * fires, the test that owned the worker has already completed — but
 * it would otherwise terminate the process.
 *
 * The filter is deliberately narrow: it matches specific messages
 * produced by specific RedisSMQ components, not error classes or
 * prefixes. A genuine bug in the same components would produce a
 * different message and still fail the run.
 */
const BENIGN_SHUTDOWN_ERRORS: readonly RegExp[] = [
  // The pool is torn down before some timer-driven component's
  // cleanup finishes; the component's next pool access finds no
  // pool.
  // /^Pool is not initialized\b/,
];

function isBenignShutdownError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return BENIGN_SHUTDOWN_ERRORS.some((re) => re.test(err.message));
}

if (process.env.STRICT_ASYNC_ERRORS !== '0') {
  process.on('unhandledRejection', (reason) => {
    const err =
      reason instanceof Error
        ? reason
        : new Error(`Non-Error rejection: ${String(reason)}`);
    if (isBenignShutdownError(err)) return;
    err.message = `[unhandledRejection] ${err.message}`;
    throw err;
  });

  process.on('uncaughtException', (err) => {
    if (isBenignShutdownError(err)) return;
    err.message = `[uncaughtException] ${err.message}`;
    throw err;
  });
}
