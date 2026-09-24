/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import {
  ERedisConnectionAcquisitionMode,
  type IConnectionPoolConfig,
} from '../../../src/core/common/redis/connection-pool/types/connection-pool.js';
import { Pool } from '../../../src/core/common/redis/connection-pool/pool.js';
import { redisConfig } from '../../helpers/config/test-config.js';

/**
 * Unit test for the Redis connection pool.
 *
 * ... (header unchanged; see previous version) ...
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * The promisified class, defined once at module scope. Every static call
 * (`initializeAsync`, `shutdownAsync`) goes through this binding — the raw
 * `Pool` class has no `*Async` methods, because promisification is a
 * bluebird operation on an object, not a modification of the class itself.
 */
const PromisifiedPool = bluebird.promisifyAll(Pool);

/**
 * Pool sizing constants, defined before the config object.
 *
 * `IConnectionPoolConfig` declares its fields as optional, so reading
 * `POOL_CONFIG.max` yields `number | undefined`. Deriving `MIN`/`MAX`
 * from the config would carry that `undefined` into every comparison
 * below. Defining the numbers first and feeding them into the config
 * keeps both the constants and the config well-typed without nullish
 * coalescing at the point of use.
 */
const MIN = 2;
const MAX = 5;

const POOL_CONFIG: IConnectionPoolConfig = {
  min: MIN,
  max: MAX,
  acquireTimeoutMillis: 3000,
  idleTimeoutMillis: 10_000,
  reapIntervalMillis: 5000,
};

/**
 * The promisified pool instance. `initializeAsync` returns the raw `Pool`
 * instance; the extra `promisifyAll` wraps it so `acquireAsync` is
 * available. `release` and `getStats` stay sync.
 */
type TPool = ReturnType<typeof bluebird.promisifyAll<Pool>>;

/** Number of concurrent operations used by the concurrency tests. */
const CONCURRENT_OPS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Exercise a leased client with a single Redis read.
 *
 * `IRedisClient` from `redis-smq-common` exposes callback-style methods
 * (`get(key, cb)`), not promise-style ones. We keep the client raw — the
 * pool tracks connections by identity, and promisifying a client would
 * mean releasing a wrapper that the pool does not recognize. So the
 * callback is wrapped in a Promise here, at the one place the test needs
 * to await it.
 *
 * A missing key is not an error — `get` resolves with `(null, null)` for
 * a nonexistent key. Only a connection-level failure rejects.
 */
async function probeClient(
  client: Awaited<ReturnType<TPool['acquireAsync']>>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    client.get('concurrent-probe', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Redis connection pool', () => {
  let pool: TPool;

  beforeEach(async () => {
    // Shut down any pool left over from a prior test file. Safe even if
    // nothing is running — `shutdown` is idempotent.
    await PromisifiedPool.shutdownAsync();

    pool = bluebird.promisifyAll(
      await PromisifiedPool.initializeAsync(redisConfig, POOL_CONFIG),
    );
  });

  afterEach(async () => {
    await PromisifiedPool.shutdownAsync();
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  it('opens config.min connections on initialization', () => {
    // `initialize` eagerly opens the pool to its minimum size; a lazy pool
    // would report `total: 0` here and only grow on first acquire. The
    // framework relies on the eager behavior so that the first operation
    // in a fresh process does not pay a connection-establishment cost.
    expect(pool.getStats().total).toBe(MIN);
    expect(pool.getStats().inUse).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Acquire / release
  // -------------------------------------------------------------------------

  describe('acquire/release', () => {
    it('leases an EXCLUSIVE connection and returns it on release', async () => {
      const client = await pool.acquireAsync(
        ERedisConnectionAcquisitionMode.EXCLUSIVE,
      );

      expect(pool.getStats().inUse).toBe(1);

      pool.release(client);

      expect(pool.getStats().inUse).toBe(0);
    });

    it('leases a SHARED connection and returns it on release', async () => {
      const client = await pool.acquireAsync(
        ERedisConnectionAcquisitionMode.SHARED,
      );

      expect(pool.getStats().inUse).toBe(1);

      pool.release(client);

      expect(pool.getStats().inUse).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Concurrent acquisitions
  // -------------------------------------------------------------------------

  describe('concurrent acquisitions', () => {
    /**
     * Run `count` acquire-doWork-release cycles concurrently and assert the
     * pool drains to zero afterwards. Each cycle holds its connection for a
     * deterministic, index-derived delay so the operations interleave in a
     * predictable pattern rather than all completing in lockstep.
     *
     * The delay pattern `(i % 3) * 30` yields three staggered groups, so
     * with `max: 5` and `count: 10` the pool is genuinely contended — some
     * acquirers wait for a release rather than getting a free slot.
     */
    async function runConcurrent(
      mode: ERedisConnectionAcquisitionMode,
    ): Promise<void> {
      const cycles = Array.from({ length: CONCURRENT_OPS }, (_, i) =>
        (async () => {
          const client = await pool.acquireAsync(mode);
          try {
            await new Promise((r) => setTimeout(r, (i % 3) * 30));
            await probeClient(client);
          } finally {
            pool.release(client);
          }
        })(),
      );

      await Promise.all(cycles);

      expect(pool.getStats().inUse).toBe(0);
    }

    it(`handles ${CONCURRENT_OPS} concurrent EXCLUSIVE acquisitions`, async () => {
      await runConcurrent(ERedisConnectionAcquisitionMode.EXCLUSIVE);
    });

    it(`handles ${CONCURRENT_OPS} concurrent SHARED acquisitions`, async () => {
      await runConcurrent(ERedisConnectionAcquisitionMode.SHARED);
    });
  });

  // -------------------------------------------------------------------------
  // Limits
  // -------------------------------------------------------------------------

  describe('limits', () => {
    it('blocks further acquisitions once EXCLUSIVE reaches config.max, and times out', async () => {
      // Saturate the pool with EXCLUSIVE leases.
      const clients: Awaited<ReturnType<TPool['acquireAsync']>>[] = [];
      for (let i = 0; i < MAX; i += 1) {
        clients.push(
          await pool.acquireAsync(ERedisConnectionAcquisitionMode.EXCLUSIVE),
        );
      }
      expect(pool.getStats().inUse).toBe(MAX);

      // Both modes must wait: EXCLUSIVE because no dedicated connection is
      // free, SHARED because the pool has no free slot to multiplex on.
      // Running them in parallel means the pair times out in ~3s rather
      // than ~6s.
      await Promise.all([
        expect(
          pool.acquireAsync(ERedisConnectionAcquisitionMode.EXCLUSIVE),
        ).rejects.toThrow(/acquire timeout/i),
        expect(
          pool.acquireAsync(ERedisConnectionAcquisitionMode.SHARED),
        ).rejects.toThrow(/acquire timeout/i),
      ]);

      // Release everything the test acquired. Not strictly necessary —
      // afterEach shuts the pool down — but it lets the in-use count
      // return to zero so a failure in this test doesn't leave the pool
      // in a state that confuses a subsequent assertion within the same
      // test.
      for (const c of clients) pool.release(c);
      expect(pool.getStats().inUse).toBe(0);
    });

    it('serves multiple SHARED leases from one underlying connection', async () => {
      // SHARED mode multiplexes: N concurrent SHARED leases occupy one
      // connection, not N. This is the property that makes SHARED useful
      // for high-frequency short-lived operations — the pool does not
      // burn a dedicated slot per caller.
      //
      // The assertion below is on `inUse` (underlying connections), which
      // is what the pool's stats track. The leases themselves are counted
      // internally by the pool's accounting; the assertion that "N
      // acquirers all got a working client" is exercised separately by the
      // concurrent-acquisitions test above.
      const clients: Awaited<ReturnType<TPool['acquireAsync']>>[] = [];
      for (let i = 0; i < MAX; i += 1) {
        clients.push(
          await pool.acquireAsync(ERedisConnectionAcquisitionMode.SHARED),
        );
      }

      expect(pool.getStats().inUse).toBe(1);

      for (const c of clients) pool.release(c);
      expect(pool.getStats().inUse).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Shutdown
  // -------------------------------------------------------------------------

  it('reports zero connections after graceful shutdown', async () => {
    expect(pool.getStats().total).toBeGreaterThan(0);

    await pool.shutdownAsync();

    expect(pool.getStats().total).toBe(0);
  });
});
