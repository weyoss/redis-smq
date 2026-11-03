/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import bluebird from 'bluebird';
import type { ICallback } from '../../../src/async/index.js';
import { OperationAbortedError } from '../../../src/errors/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { TestBackoff } from './common/test-backoff.js';

function promisify<T extends TestBackoff>(b: T) {
  return bluebird.promisifyAll(b);
}

/**
 * Test-only backoff whose actual retry delay is 10ms, 20ms, 30ms...,
 * independent of `baseDelay`. This lets the tests use real timers while
 * still configuring a valid `baseDelay` (the constructor enforces
 * `baseDelay >= 1000ms`).
 *
 * Using fake timers with bluebird deadlocks — bluebird's scheduler is
 * built on `setImmediate`, which `vi.useFakeTimers()` replaces globally.
 * Overriding the delay function is simpler and more robust.
 */
class FastTestBackoff extends TestBackoff {
  override getNextDelay(_baseDelay: number, attempts: number): number {
    return 10 * attempts;
  }
}

describe('Backoff: execute()', () => {
  describe('no retry needed', () => {
    it('succeeds on the first attempt', async () => {
      const backoff = promisify(new TestBackoff(getDummyLogger()));
      await backoff.runAsync();

      const task = vi.fn((cb: ICallback<string>) => cb(null, 'success'));
      await expect(backoff.executeAsync(task)).resolves.toBe('success');
      expect(task).toHaveBeenCalledTimes(1);

      await backoff.shutdownAsync();
    });

    it('does not retry on OperationAbortedError', async () => {
      const backoff = promisify(new TestBackoff(getDummyLogger()));
      await backoff.runAsync();

      const task = vi.fn((cb: ICallback<string>) => {
        cb(new OperationAbortedError({ message: 'Operation aborted' }));
      });

      await expect(backoff.executeAsync(task)).rejects.toThrow(
        OperationAbortedError,
      );
      expect(task).toHaveBeenCalledTimes(1);

      await backoff.shutdownAsync();
    });
  });

  describe('with retries', () => {
    it('retries after failure and succeeds on the next attempt', async () => {
      const backoff = promisify(
        new FastTestBackoff(getDummyLogger(), {
          baseDelay: 1000,
          maxDelay: 5000,
          jitter: false,
        }),
      );
      await backoff.runAsync();

      const task = vi
        .fn()
        .mockImplementationOnce((cb: ICallback<string>) =>
          cb(new Error('fail')),
        )
        .mockImplementationOnce((cb: ICallback<string>) => cb(null, 'success'));

      await expect(backoff.executeAsync(task)).resolves.toBe('success');
      expect(task).toHaveBeenCalledTimes(2);

      await backoff.shutdownAsync();
    });

    it('respects maxAttempts and fails after N attempts', async () => {
      const backoff = promisify(
        new FastTestBackoff(getDummyLogger(), {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        }),
      );
      await backoff.runAsync();

      const task = vi.fn((cb: ICallback<string>) => cb(new Error('fail')));
      await expect(backoff.executeAsync(task)).rejects.toThrow('fail');
      expect(task).toHaveBeenCalledTimes(3);

      await backoff.shutdownAsync();
    });

    it('caps delays at maxDelay even when the strategy grows fast', () => {
      // Test `calculateNextDelay` directly at each attempt value — no
      // retries, no timers. Covers more attempt counts than the original
      // test did by running a real retry loop for 20+ seconds.
      class CapTestBackoff extends TestBackoff {
        delays: number[] = [];
        override getNextDelay(base: number, attempts: number) {
          return base * Math.pow(10, attempts); // grows very fast
        }
        override calculateNextDelay(): number {
          const r = super.calculateNextDelay();
          this.delays.push(r);
          return r;
        }
      }

      const backoff = new CapTestBackoff(getDummyLogger(), {
        baseDelay: 1000,
        maxDelay: 3000,
      });

      for (const n of [1, 2, 3, 5, 10, 100]) {
        backoff.setAttempts(n);
        expect(backoff.calculateNextDelay()).toBeLessThanOrEqual(3000);
      }

      // Sanity: the recording hook fired for each attempt value.
      expect(backoff.delays).toHaveLength(6);
    });
  });
});
