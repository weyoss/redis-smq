/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisTransaction } from './redis-client.js';

export interface IWatchTransactionOptions {
  /**
   * Maximum number of attempts (including the first one). Default: 5
   */
  maxAttempts?: number;
  /**
   * Optional backoff strategy in milliseconds. Return a number to delay before retrying.
   * Return undefined or <= 0 for no delay.
   */
  backoff?: (attemptNo: number) => number | undefined;
  /**
   * Optional factory to create a domain-specific error when retries are exhausted.
   */
  makeRetryExceededError?: () => Error;
  /**
   * Optional hook invoked on each retry before scheduling the next attempt.
   */
  onRetry?: (attemptNo: number, maxAttempts: number) => void;
  /**
   * Optional hook invoked when EXEC fails with an error (not null abort).
   */
  onExecError?: (err: Error) => void;
  /**
   * Optional hook invoked when WATCH returns an error.
   */
  onWatchError?: (err: Error) => void;
}

export interface IWatchTransactionAttemptResult {
  /**
   * Prepared MULTI to be executed atomically. Helper will call exec() on it.
   */
  multi: IRedisTransaction;
  /**
   * Optional post-success hook. Called after a successful EXEC (non-null result).
   */
  afterExec?: (execResult: unknown[]) => void;
}
