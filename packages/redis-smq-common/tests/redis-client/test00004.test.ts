/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { describe, expect, it, vi } from 'vitest';
import {
  IRedisClient,
  withWatchTransaction,
} from '../../src/redis-client/index.js';
import { getRedisInstance } from '../common.js';

const withWatchTransactionAsync = bluebird.promisify(withWatchTransaction);

describe('withWatchTransaction (integration)', () => {
  const keyPrefix = `wtx:vitest:${Date.now()}:`;

  it('commits MULTI/EXEC successfully when watched keys are not modified', async () => {
    const key = `${keyPrefix}success:counter`;
    const client = await getRedisInstance();
    await withWatchTransactionAsync(
      client,
      (
        clientInner: IRedisClient,
        watch: (keys: string[], cb: (err?: Error | null) => void) => void,
        done,
      ) => {
        // WATCH the key
        watch([key], (watchErr) => {
          if (watchErr) return done(watchErr);

          // Build transaction
          const multi = clientInner.multi();
          // Start from 0 -> increment to 1
          multi.hset(key, 'count', 1);
          multi.hincrby(key, 'count', 1);

          // Hand back the MULTI instance
          done(null, { multi });
        });
      },
    );

    const value = await client.hgetAsync(key, 'count');
    expect(value).toBe('2');
  });

  it('aborts transaction when a watched key is modified before EXEC (maxAttempts=1)', async () => {
    const key = `${keyPrefix}abort:counter`;
    const client = await getRedisInstance();
    await client.hsetAsync(key, 'count', 1);

    await expect(
      withWatchTransactionAsync(
        client,
        (
          clientInner: IRedisClient,
          watch: (keys: string[], cb: (err?: Error | null) => void) => void,
          done,
        ) => {
          watch([key], (watchErr) => {
            if (watchErr) return done(watchErr);

            // Simulate a concurrent change BEFORE we build MULTI/EXEC.
            // We can use the same connection to mutate — Redis will mark the
            // watched keys as dirty and EXEC should abort.
            clientInner.hset(key, 'count', '2', (err) => {
              if (err) return done(err);
              const multi = clientInner.multi();
              multi.hset(key, 'count', '3'); // This should not commit due to abort.
              done(null, { multi });
            });
          });
        },
      ),
    ).rejects.toBeTruthy();

    // Value should reflect the interfering HSET (2), not the transactional HSET(3)
    const value = await client.hgetAsync(key, 'count');
    expect(value).toBe('2');
  });

  it('retries on concurrent modification and succeeds on a subsequent attempt', async () => {
    const key = `${keyPrefix}retry:counter`;

    const client = await getRedisInstance();
    await client.hsetAsync(key, 'count', '0');

    let attempt = 0;
    const onRetry = vi.fn();

    await new Promise((resolve) => {
      withWatchTransaction(
        client,
        (
          clientInner: IRedisClient,
          watch: (keys: string[], cb: (err?: Error | null) => void) => void,
          done,
        ) => {
          watch([key], (watchErr) => {
            if (watchErr) return done(watchErr);

            attempt += 1;

            // First attempt: induce a conflict
            if (attempt === 1) {
              clientInner.hset(key, 'count', 1, (e) => {
                if (e) return done(e);
                const multi = clientInner.multi();
                multi.hset(key, 'count', '2'); // Try to set 2, first attempt should abort
                done(null, { multi });
              });
            } else {
              // Second attempt: no interference, should commit
              const multi = clientInner.multi();
              multi.hset(key, 'count', 3);
              done(null, { multi });
            }
          });
        },
        (err?: Error | null) => resolve(err ?? null),
        {
          maxAttempts: 3,
          onRetry: (attemptNo: number, maxAttempts: number) =>
            onRetry(attemptNo, maxAttempts),
        },
      );
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, 3);

    const value = await client.hgetAsync(key, 'count');
    expect(value).toBe('3');
  });

  it('propagates attempt errors (and does not commit any queued ops)', async () => {
    const key = `${keyPrefix}attempt:error`;
    const client = await getRedisInstance();

    const injectedError = new Error('injected attempt error');
    const resultErr = await new Promise<Error | null>((resolve) => {
      withWatchTransaction(
        client,
        (
          clientInner: IRedisClient,
          watch: (keys: string[], cb: (err?: Error | null) => void) => void,
          done,
        ) => {
          watch([key], (watchErr) => {
            if (watchErr) return done(watchErr);
            // Fail the attempt before returning a MULTI
            done(injectedError);
          });
        },
        (err?: Error | null) => resolve(err ?? null),
        { maxAttempts: 1 },
      );
    });

    expect(resultErr).toBe(injectedError);
  });
});
