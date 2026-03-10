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
import { getDummyLogger } from '../../src/logger/index.js';

describe('Backoff: state management', () => {
  it('should track attempts', async () => {
    let attempts = 0;
    class CustomBackoff extends TestBackoff {
      override getNextDelay(base: number, attempts: number) {
        return base * Math.pow(10, attempts); // Would grow very fast
      }

      override reset(): void {
        attempts = this.attempts;
        super.reset();
      }
    }

    const backoff = bluebird.promisifyAll(
      new CustomBackoff(
        getDummyLogger(),
        { baseDelay: 1000, maxDelay: 5000, jitter: false }, // Small delay for testing
      ),
    );
    await backoff.runAsync();

    const task = vi
      .fn()
      .mockImplementationOnce((cb) => cb(new Error('fail')))
      .mockImplementationOnce((cb) => cb(new Error('fail')))
      .mockImplementationOnce((cb) => cb(null, 'success'));

    const result = await backoff.executeAsync(task);

    expect(result).toBe('success');
    expect(attempts).toBe(3); // Failed twice, succeeded on third

    await backoff.shutdownAsync();
  });

  it('should reset state', async () => {
    const backoff = bluebird.promisifyAll(new TestBackoff(getDummyLogger()));
    await backoff.runAsync();

    // Run a failed execution
    const task = vi
      .fn()
      .mockImplementationOnce((cb) => cb(new Error('fail')))
      .mockImplementationOnce((cb) => cb(new Error('fail')))
      .mockImplementationOnce((cb) => cb(null, 'success'));

    await backoff.executeAsync(task);

    // after success the state is reset
    expect(backoff.getAttempts()).toEqual(0);

    await backoff.shutdownAsync();
  });
});
