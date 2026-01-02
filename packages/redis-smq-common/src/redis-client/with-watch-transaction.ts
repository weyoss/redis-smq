/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../async/index.js';
import {
  WatchedKeysChangedError,
  WatchTransactionMaxRetriesExceeded,
} from './errors/index.js';
import { IRedisClient } from './types/index.js';
import {
  IWatchTransactionAttemptResult,
  IWatchTransactionOptions,
} from './types/index.js';
import { CallbackEmptyReplyError } from '../errors/index.js';

/**
 * Runs a WATCH/MULTI/EXEC attempt with automatic retry on concurrent modification.
 * The provided attemptFn must:
 *  - Call api.watch(...) before performing any reads that inform writes.
 *  - Perform the necessary reads and validations.
 *  - Build and return a MULTI with the intended writes.
 *
 * Helper guarantees:
 *  - client.unwatch() is called on any attempt error or aborted EXEC before retrying or returning.
 *  - Retries up to options.maxAttempts (default 3). If exhausted, returns options.makeRetryExceededError()
 *    if provided, otherwise a generic Error.
 */
export function withWatchTransaction(
  client: IRedisClient,
  attemptFn: (
    client: IRedisClient,
    watch: (keys: string | string[], cb: ICallback<void>) => void,
    cb: ICallback<IWatchTransactionAttemptResult>,
  ) => void,
  callback: ICallback<unknown[]>,
  options?: IWatchTransactionOptions,
): void {
  const maxAttempts = options?.maxAttempts ?? 3;

  const doAttempt = (attemptNo: number): void => {
    if (attemptNo > maxAttempts) {
      const err =
        options?.makeRetryExceededError?.() ??
        new WatchTransactionMaxRetriesExceeded();
      return callback(err);
    }

    const watch = (keys: string | string[], cb: ICallback<void>) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      if (arr.length === 0) return cb();
      client.watch(arr, (err) => {
        if (err && options?.onWatchError) options.onWatchError(err);
        cb(err || null);
      });
    };

    attemptFn(client, watch, (attemptErr, result) => {
      if (attemptErr) {
        // Clear WATCH state on any attempt error
        return client.unwatch(() => callback(attemptErr));
      }

      if (!result || !result.multi) {
        // Defensive: invalid attempt result
        return client.unwatch(() =>
          callback(
            new CallbackEmptyReplyError({
              message:
                'Invalid attempt result. Expected a result object with a "multi" key.',
            }),
          ),
        );
      }

      result.multi.exec((execErr, execRes) => {
        if (execErr) {
          // watched key modified, retry
          if (execErr instanceof WatchedKeysChangedError) {
            options?.onRetry?.(attemptNo, maxAttempts);
            // Clear WATCH then retry with optional backoff
            return client.unwatch(() => {
              const backoff = options?.backoff ?? ((n) => n * 1000);
              const delay = backoff(attemptNo);
              if (delay && delay > 0) {
                setTimeout(() => doAttempt(attemptNo + 1), delay);
              } else {
                doAttempt(attemptNo + 1);
              }
            });
          }
          if (options?.onExecError) options.onExecError(execErr);
          // Clear WATCH, propagate error
          return client.unwatch(() => callback(execErr));
        }

        // Success: WATCH state is cleared automatically by EXEC
        if (result.afterExec) {
          try {
            result.afterExec(execRes ?? []);
          } catch (e: unknown) {
            const err = e instanceof Error ? e : new Error(String(e));
            // Ensure errors thrown in afterExec do not leave WATCH state hanging
            return callback(err);
          }
        }
        callback(null, execRes);
      });
    });
  };

  doAttempt(1);
}
