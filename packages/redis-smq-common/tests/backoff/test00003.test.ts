/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import { TestBackoff } from './common/test-backoff.js';
import bluebird from 'bluebird';
import { ICallback } from '../../src/async/index.js';
import { AbortError } from '../../src/errors/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

describe('Backoff: execute', () => {
  it('should succeed on first attempt', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));
    await backoff.runAsync();

    const task = vi.fn((cb: ICallback<string>) => {
      cb(null, 'success');
    });

    const result = await backoff.executeAsync(task);
    expect(result).toBe('success');
    expect(task).toHaveBeenCalledTimes(1);

    await backoff.shutdownAsync();
  });

  it('should retry on failure', async () => {
    const backoff = bluebird.promisifyAll(
      new TestBackoff(getDummyLogger(), {
        baseDelay: 1000,
        maxDelay: 5000,
        jitter: false,
      }),
    );
    await backoff.runAsync();

    const task = vi
      .fn()
      .mockImplementationOnce((cb: ICallback<string>) => cb(new Error('fail')))
      .mockImplementationOnce((cb: ICallback<string>) => cb(null, 'success'));

    const resultPromise = backoff.executeAsync(task);

    // Wait for the retry delay
    await bluebird.delay(1100); // Slightly more than baseDelay

    const result = await resultPromise;
    expect(result).toBe('success');
    expect(task).toHaveBeenCalledTimes(2);

    await backoff.shutdownAsync();
  });

  it('should not retry on AbortError', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));
    await backoff.runAsync();

    const task = vi.fn((cb: ICallback<string>) => {
      cb(
        new AbortError({
          message: 'Operation aborted',
        }),
      );
    });

    await expect(backoff.executeAsync(task)).rejects.toThrow(AbortError);

    expect(task).toHaveBeenCalledTimes(1);

    await backoff.shutdownAsync();
  });

  it('should respect maxDelay cap', async () => {
    const delays: number[] = [];
    let error: Error | null = null;

    class CustomBackoff extends TestBackoff {
      override getNextDelay(base: number, attempts: number) {
        return base * Math.pow(10, attempts); // Would grow very fast
      }

      override calculateNextDelay(): number {
        const r = super.calculateNextDelay();
        delays.push(r);
        return r;
      }
    }

    const customBackoff = bluebird.promisifyAll(
      new CustomBackoff(getDummyLogger(), { baseDelay: 1000, maxDelay: 3000 }),
    );
    await customBackoff.runAsync();

    const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
    customBackoff.executeAsync(task).catch((err: Error) => {
      error = err;
    });

    await bluebird.delay(20_000);

    //
    expect(error).toBe(null);
    expect(delays.length).toBeGreaterThan(5);

    // All delays should be capped at 3000ms
    delays.forEach((delay) => {
      expect(delay).toBeLessThanOrEqual(3000);
    });

    await customBackoff.shutdownAsync();
  });

  it('should respect maxAttempts', async () => {
    const testBackoff = bluebird.promisifyAll(
      new TestBackoff(getDummyLogger(), {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5_000,
      }),
    );
    await testBackoff.runAsync();

    const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
    await expect(testBackoff.executeAsync(task)).rejects.toThrow('fail');

    expect(task).toHaveBeenCalledTimes(3);

    await testBackoff.shutdownAsync();
  });
});
