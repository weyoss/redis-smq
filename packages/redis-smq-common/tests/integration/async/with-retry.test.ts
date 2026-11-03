/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ICallback } from '../../../src/async/index.js';
import { async } from '../../../src/async/index.js';

interface RetryOptions {
  maxAttempts?: number;
  retryDelay?: number;
  shouldRetry?: (err: Error) => boolean;
}

function runWithRetry<T>(
  operation: (cb: ICallback<T>) => void,
  options: RetryOptions = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    async.withRetry(operation, options as never, (err, result) =>
      err ? reject(err) : resolve(result as T),
    );
  });
}

describe('withRetry', () => {
  it('succeeds on the first attempt without retrying', async () => {
    const task = vi.fn((cb: ICallback<string>) => cb(null, 'success'));
    const result = await runWithRetry(task, { maxAttempts: 3 });
    expect(result).toBe('success');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('rejects after exhausting maxAttempts', async () => {
    const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
    await expect(
      runWithRetry(task, { maxAttempts: 3, retryDelay: 10 }),
    ).rejects.toThrow('fail');
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('succeeds after retries when the operation eventually succeeds', async () => {
    let attempt = 0;
    const task = (cb: ICallback<string>) => {
      attempt += 1;
      if (attempt < 3) cb(new Error('temp'));
      else cb(null, 'success');
    };
    const result = await runWithRetry(task, {
      maxAttempts: 3,
      retryDelay: 10,
    });
    expect(result).toBe('success');
    expect(attempt).toBe(3);
  });

  it('honours shouldRetry=false and stops after the first attempt', async () => {
    const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
    await expect(
      runWithRetry(task, {
        maxAttempts: 3,
        retryDelay: 10,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('fail');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('honours shouldRetry selecting specific errors', async () => {
    let attempt = 0;
    const task = (cb: ICallback<string>) => {
      attempt += 1;
      if (attempt < 3) cb(new Error('Retryable error'));
      else cb(null, 'success');
    };
    const result = await runWithRetry(task, {
      maxAttempts: 3,
      retryDelay: 10,
      shouldRetry: (err) => err.message === 'Retryable error',
    });
    expect(result).toBe('success');
  });

  it('with maxAttempts=0 still attempts the operation exactly once', async () => {
    const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
    await expect(runWithRetry(task, { maxAttempts: 0 })).rejects.toThrow(
      'fail',
    );
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('accepts a negative retryDelay (treated as no delay)', async () => {
    const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
    await expect(
      runWithRetry(task, { maxAttempts: 2, retryDelay: -1000 }),
    ).rejects.toThrow('fail');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('succeeds with an undefined result', async () => {
    const task = (cb: ICallback<undefined>) => cb(null, undefined);
    const result = await runWithRetry(task, { maxAttempts: 0 });
    expect(result).toBeUndefined();
  });

  it('propagates errors thrown synchronously by the operation', async () => {
    const task = () => {
      throw new Error('sync error');
    };
    await expect(runWithRetry(task, {})).rejects.toThrow('sync error');
  });

  it('respects the retry delay between attempts', async () => {
    const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
    const start = Date.now();
    await expect(
      runWithRetry(task, { maxAttempts: 3, retryDelay: 30 }),
    ).rejects.toThrow('fail');
    const elapsed = Date.now() - start;
    // 2 gaps between 3 attempts × 30ms = at least 60ms.
    expect(elapsed).toBeGreaterThanOrEqual(60);
    expect(task).toHaveBeenCalledTimes(3);
  });
});
