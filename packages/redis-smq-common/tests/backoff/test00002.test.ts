/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { TestBackoff } from './common/test-backoff.js';
import { getDummyLogger } from '../../src/logger/index.js';

describe('Backoff: constructor with explicit config', () => {
  it('should accept valid explicit config', () => {
    const backoff = new TestBackoff(getDummyLogger(), {
      baseDelay: 2000,
      maxDelay: 30000,
    });
    const config = backoff.getConfig();

    expect(config.baseDelay).toBe(2000);
    expect(config.maxDelay).toBe(30000);
  });

  it('should throw if baseDelay exceeds maxDelay', () => {
    expect(
      () =>
        new TestBackoff(getDummyLogger(), { baseDelay: 5000, maxDelay: 3000 }),
    ).toThrow('baseDelay (5000ms) cannot exceed maxDelay (3000ms)');
  });

  it('should throw if baseDelay is below minimum', () => {
    expect(
      () =>
        new TestBackoff(getDummyLogger(), { baseDelay: 500, maxDelay: 30000 }),
    ).toThrow('baseDelay (500ms) is below minimum recommended');
  });

  it('should throw if maxDelay exceeds cap', () => {
    expect(
      () =>
        new TestBackoff(getDummyLogger(), {
          baseDelay: 2000,
          maxDelay: 600_000,
        }),
    ).toThrow('maxDelay (600000ms) exceeds maximum allowed (60000ms)');
  });

  it('should throw if maxAttempts is negative', () => {
    expect(
      () =>
        new TestBackoff(getDummyLogger(), {
          maxAttempts: -12,
        }),
    ).toThrow('maxAttempts (-12) cannot be a negative integer');
  });
});
