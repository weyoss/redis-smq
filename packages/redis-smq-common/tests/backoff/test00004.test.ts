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

describe('Backoff: jitter', () => {
  it('should apply jitter when enabled', async () => {
    const backoff = bluebird.promisifyAll(
      new TestBackoff(getDummyLogger(), {
        jitter: true,
      }),
    );
    await backoff.runAsync();

    // Mock random to return predictable values
    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const delay = backoff.calculateNextDelay();

    // With random=0.5 and ±20% range, should be exactly base delay
    expect(delay).toBe(1000);

    mockRandom.mockRestore();
    await backoff.shutdownAsync();
  });

  it('should not apply jitter when disabled', async () => {
    const backoff = bluebird.promisifyAll(
      new TestBackoff(getDummyLogger(), {
        jitter: false,
      }),
    );
    await backoff.runAsync();

    const delay = backoff.calculateNextDelay();
    expect(delay).toBe(1000);

    await backoff.shutdownAsync();
  });

  it('should produce values within ±20% range', async () => {
    const backoff = bluebird.promisifyAll(
      new TestBackoff(getDummyLogger(), {
        baseDelay: 1000,
        maxDelay: 5000,
        jitter: true,
      }),
    );
    await backoff.runAsync();

    // Test multiple random values
    for (let i = 0; i < 100; i++) {
      const delay = backoff.calculateNextDelay();
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1200);
    }

    await backoff.shutdownAsync();
  });
});
