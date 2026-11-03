/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBackoff } from './common/test-backoff.js';
import { getDummyLogger } from '../../../src/logger/index.js';

describe('Backoff: jitter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies ±20% jitter when enabled', () => {
    const backoff = new TestBackoff(getDummyLogger(), { jitter: true });

    // Math.random = 0.5 → multiplier = 1 + (0.5 * 2 - 1) * 0.2 = 1
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(backoff.calculateNextDelay()).toBe(1000);
  });

  it('does not apply jitter when disabled', () => {
    const backoff = new TestBackoff(getDummyLogger(), { jitter: false });
    expect(backoff.calculateNextDelay()).toBe(1000);
  });

  it('produces values within ±20% of baseDelay across many random draws', () => {
    const backoff = new TestBackoff(getDummyLogger(), {
      baseDelay: 1000,
      maxDelay: 5000,
      jitter: true,
    });

    for (let i = 0; i < 100; i++) {
      const delay = backoff.calculateNextDelay();
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1200);
    }
  });
});
