/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Wipe Redis data between tests.
 *
 * Called from `tests/setup/per-test.ts` in `beforeEach`, after the
 * previous test's teardown has run and before `RedisSMQ.initialize()`.
 *
 * The server this flushes is the *worker's own* embedded server, started
 * in `tests/setup/global.ts`'s `beforeAll`. `redisConfig` was mutated by
 * that hook to point at the new port, and this helper reads the object at
 * call time — so it always targets the correct server without the caller
 * having to pass a port.
 *
 * DESIGN NOTES:
 *
 *   - Uses a bare `Client` (from `src`), NOT the connection pool. The
 *     pool may still have connections from the previous test that are
 *     being released; going through it here would either be a no-op or
 *     race the release. A fresh client is also stateless, which is what
 *     a flush wants.
 *
 *   - Flushes `flushall` (all databases), not `flushdb`. The test config
 *     pins RedisSMQ to db 1, but nothing guarantees every code path stays
 *     there. On a single-tenant per-worker server, flushing all is free.
 *
 *   - Closes with `quit()`, not `shutdown()`. `quit()` sends a graceful
 *     QUIT for *this client's* socket. `shutdown()` would stop the
 *     server entirely — which the old `start-up.ts` did per test, and
 *     which the per-worker design makes both unnecessary and wrong: this
 *     worker's server is reused across every test in the file.
 *
 *   - Errors are not swallowed. If the flush fails, every subsequent test
 *     in the file would start from dirty state. Failing loudly here is
 *     the only way to surface the real problem early. The `quit()` call
 *     is guarded so a close failure cannot mask an earlier flush error.
 *
 * COST:
 *
 *   One `Client` is created and destroyed per call — i.e. per test. On
 *   the per-worker server this opens a fresh TCP connection each time,
 *   which is a couple of milliseconds against a server that has been
 *   alive for the duration of the file. If profiling ever shows flush as
 *   a hotspot, the fix is a worker-scoped lazy singleton client that is
 *   closed in `global.ts`'s `afterAll`, not a change to this helper's
 *   semantics. Correctness first.
 */

import bluebird from 'bluebird';
import type { IRedisClient, IRedisConfig } from 'redis-smq-common';
import { Client } from '../../../src/core/common/redis/client.js';

export async function flushAll(redisConfig: IRedisConfig): Promise<void> {
  const client = bluebird.promisifyAll(new Client(redisConfig));
  const rdb: IRedisClient = await client.getSetInstanceAsync();
  const instance = bluebird.promisifyAll(rdb);

  try {
    await instance.flushallAsync();
  } finally {
    await instance.haltAsync().catch(() => undefined);
  }
}
