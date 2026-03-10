/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { ExponentialBackoff } from '../../src/backoff/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

class CustomBackoff extends ExponentialBackoff {
  override getNextDelay(baseDelay: number, attempts: number): number {
    return super.getNextDelay(baseDelay, attempts);
  }
}

describe('ExponentialBackoff: getNextDelay', () => {
  it('should calculate exponential delays with default factor 2', () => {
    const backoff = new CustomBackoff(getDummyLogger());

    // Access the protected method for testing
    const getNextDelay = backoff.getNextDelay.bind(backoff);

    // Test values: baseDelay * 2^attempts
    expect(getNextDelay(1000, 0)).toBe(1000); // 1000 * 2^0 = 1000
    expect(getNextDelay(1000, 1)).toBe(2000); // 1000 * 2^1 = 2000
    expect(getNextDelay(1000, 2)).toBe(4000); // 1000 * 2^2 = 4000
    expect(getNextDelay(1000, 3)).toBe(8000); // 1000 * 2^3 = 8000
    expect(getNextDelay(1000, 4)).toBe(16000); // 1000 * 2^4 = 16000
    expect(getNextDelay(1000, 5)).toBe(32000); // 1000 * 2^5 = 32000
  });

  it('should calculate exponential delays with custom factor 1.5', () => {
    const backoff = new CustomBackoff(getDummyLogger(), {
      factor: 1.5,
    });

    const getNextDelay = backoff.getNextDelay.bind(backoff);

    // Test values: baseDelay * 1.5^attempts
    expect(getNextDelay(1000, 0)).toBe(1000); // 1000 * 1.5^0 = 1000
    expect(getNextDelay(1000, 1)).toBe(1500); // 1000 * 1.5^1 = 1500
    expect(getNextDelay(1000, 2)).toBe(2250); // 1000 * 1.5^2 = 2250
    expect(getNextDelay(1000, 3)).toBe(3375); // 1000 * 1.5^3 = 3375
    expect(getNextDelay(1000, 4)).toBe(5062.5); // 1000 * 1.5^4 = 5062.5
    expect(getNextDelay(1000, 5)).toBe(7593.75); // 1000 * 1.5^5 = 7593.75
  });
});
