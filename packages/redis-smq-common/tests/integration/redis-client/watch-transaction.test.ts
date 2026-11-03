/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  type IRedisClient,
  withWatchTransaction,
} from '../../../src/redis-client/index.js';
import { getRedisInstance } from '../../helpers/common.js';

type Attempt = (
  client: IRedisClient,
  watch: (keys: string[], cb: (err?: Error | null) => void) => void,
  done: (err?: Error | null, result?: { multi: unknown }) => void,
) => void;

interface WatchOptions {
  maxAttempts?: number;
  onRetry?: (attempt: number, maxAttempts: number) => void;
}

/**
 * Promise wrapper around `withWatchTransaction` — keeps the same
 * shape as the callback API so tests read like they used to.
 */
function runWatchTransaction(
  client: IRedisClient,
  attempt: Attempt,
  options: WatchOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    withWatchTransaction(
      client,
      attempt as never,
      (err?: Error | null) => (err ? reject(err) : resolve()),
      options as never,
    );
  });
}

const KEY_PREFIX = `wtx:vitest:${Date.now()}:`;

describe('withWatchTransaction (integration)', () => {
  describe('successful commit', () => {
    it('commits when no watched key was modified between WATCH and EXEC', async () => {
      const key = `${KEY_PREFIX}success:counter`;
      const client = await getRedisInstance();

      await runWatchTransaction(client, (inner, watch, done) => {
        watch([key], (watchErr) => {
          if (watchErr) return done(watchErr);
          const multi = inner.multi();
          multi.hset(key, 'count', 1);
          multi.hincrby(key, 'count', 1);
          done(null, { multi });
        });
      });

      await expect(client.hgetAsync(key, 'count')).resolves.toBe('2');
    });
  });

  describe('abort on concurrent modification', () => {
    it('aborts the transaction when a watched key is touched before EXEC (maxAttempts=1)', async () => {
      const key = `${KEY_PREFIX}abort:counter`;
      const client = await getRedisInstance();
      await client.hsetAsync(key, 'count', 1);

      await expect(
        runWatchTransaction(
          client,
          (inner, watch, done) => {
            watch([key], (watchErr) => {
              if (watchErr) return done(watchErr);
              // Touching the same key marks it dirty; EXEC must abort.
              inner.hset(key, 'count', '2', (err) => {
                if (err) return done(err);
                const multi = inner.multi();
                multi.hset(key, 'count', '3'); // must NOT commit
                done(null, { multi });
              });
            });
          },
          { maxAttempts: 1 },
        ),
      ).rejects.toBeTruthy();

      // The interfering HSET(2) wins; the transactional HSET(3) never ran.
      await expect(client.hgetAsync(key, 'count')).resolves.toBe('2');
    });

    it('retries after a conflict and succeeds on the next attempt', async () => {
      const key = `${KEY_PREFIX}retry:counter`;
      const client = await getRedisInstance();
      await client.hsetAsync(key, 'count', '0');

      let attempt = 0;
      const onRetry = vi.fn();

      await runWatchTransaction(
        client,
        (inner, watch, done) => {
          watch([key], (watchErr) => {
            if (watchErr) return done(watchErr);
            attempt += 1;

            if (attempt === 1) {
              // First attempt: force a conflict, so EXEC aborts.
              inner.hset(key, 'count', 1, (e) => {
                if (e) return done(e);
                const multi = inner.multi();
                multi.hset(key, 'count', '2');
                done(null, { multi });
              });
            } else {
              // Second attempt: no interference — this one commits.
              const multi = inner.multi();
              multi.hset(key, 'count', 3);
              done(null, { multi });
            }
          });
        },
        { maxAttempts: 3, onRetry },
      );

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, 3);
      expect(attempt).toBe(2);
      await expect(client.hgetAsync(key, 'count')).resolves.toBe('3');
    });
  });

  describe('error propagation', () => {
    it('propagates the attempt error without committing queued ops', async () => {
      const key = `${KEY_PREFIX}attempt:error`;
      const client = await getRedisInstance();
      const injected = new Error('injected attempt error');

      await expect(
        runWatchTransaction(
          client,
          (_inner, watch, done) => {
            watch([key], (watchErr) => {
              if (watchErr) return done(watchErr);
              done(injected);
            });
          },
          { maxAttempts: 1 },
        ),
      ).rejects.toBe(injected);
    });
  });
});
