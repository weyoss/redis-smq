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
import { getDummyLogger } from '../../../src/logger/index.js';
import { TestBackoff } from './common/test-backoff.js';

/**
 * Same technique as `execute.test.ts` — override `getNextDelay` to return
 * 10ms × attempts instead of `baseDelay × attempts`. Real timers, real
 * retries, ~60ms total wall clock.
 */
class FastTestBackoff extends TestBackoff {
  override getNextDelay(_baseDelay: number, attempts: number): number {
    return 10 * attempts;
  }
}

describe('Backoff: state management', () => {
  it('accumulates the attempt count during execution', async () => {
    let attemptsAtReset = 0;

    class ObservedFastBackoff extends FastTestBackoff {
      override reset(): void {
        attemptsAtReset = this.attempts;
        super.reset();
      }
    }

    const backoff = bluebird.promisifyAll(
      new ObservedFastBackoff(getDummyLogger(), {
        baseDelay: 1000,
        maxDelay: 5000,
        jitter: false,
      }),
    );
    await backoff.runAsync();

    const task = vi
      .fn()
      .mockImplementationOnce((cb: ICallback<unknown>) => cb(new Error('fail')))
      .mockImplementationOnce((cb: ICallback<unknown>) => cb(new Error('fail')))
      .mockImplementationOnce((cb: ICallback<unknown>) => cb(null, 'success'));

    await expect(backoff.executeAsync(task)).resolves.toBe('success');
    expect(task).toHaveBeenCalledTimes(3);
    expect(attemptsAtReset).toBe(3);

    await backoff.shutdownAsync();
  });

  it('resets attempt state after a successful execution', async () => {
    const backoff = bluebird.promisifyAll(
      new FastTestBackoff(getDummyLogger()),
    );
    await backoff.runAsync();

    const task = vi
      .fn()
      .mockImplementationOnce((cb: ICallback<unknown>) => cb(new Error('fail')))
      .mockImplementationOnce((cb: ICallback<unknown>) => cb(new Error('fail')))
      .mockImplementationOnce((cb: ICallback<unknown>) => cb(null, 'success'));

    await expect(backoff.executeAsync(task)).resolves.toBe('success');

    // The successful execution resets internal counters back to 0.
    expect(backoff.getAttempts()).toBe(0);

    await backoff.shutdownAsync();
  });
});
