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
import { PolynomialBackoff } from '../../src/backoff/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

class CustomBackoff extends PolynomialBackoff {
  override getNextDelay(baseDelay: number, attempts: number): number {
    return super.getNextDelay(baseDelay, attempts);
  }
}

describe('PolynomialBackoff: getNextDelay', () => {
  it('should calculate cubic root delays correctly', () => {
    const backoff = new CustomBackoff(getDummyLogger());

    // Access the protected method for testing
    const getNextDelay = backoff.getNextDelay.bind(backoff);

    // Test values: baseDelay * (attempts + 1)^(1/3)
    expect(getNextDelay(1000, 0)).toBeCloseTo(1000 * Math.pow(1, 1 / 3), 0); // 1000 * 1 = 1000
    expect(getNextDelay(1000, 1)).toBeCloseTo(1000 * Math.pow(2, 1 / 3), 0); // 1000 * 1.26 = 1260
    expect(getNextDelay(1000, 2)).toBeCloseTo(1000 * Math.pow(3, 1 / 3), 0); // 1000 * 1.442 = 1442
    expect(getNextDelay(1000, 3)).toBeCloseTo(1000 * Math.pow(4, 1 / 3), 0); // 1000 * 1.587 = 1587
    expect(getNextDelay(1000, 4)).toBeCloseTo(1000 * Math.pow(5, 1 / 3), 0); // 1000 * 1.71 = 1710
    expect(getNextDelay(1000, 5)).toBeCloseTo(1000 * Math.pow(6, 1 / 3), 0); // 1000 * 1.817 = 1817
    expect(getNextDelay(1000, 6)).toBeCloseTo(1000 * Math.pow(7, 1 / 3), 0); // 1000 * 1.913 = 1913
    expect(getNextDelay(1000, 7)).toBeCloseTo(1000 * Math.pow(8, 1 / 3), 0); // 1000 * 2 = 2000
    expect(getNextDelay(1000, 8)).toBeCloseTo(1000 * Math.pow(9, 1 / 3), 0); // 1000 * 2.08 = 2080
    expect(getNextDelay(1000, 9)).toBeCloseTo(1000 * Math.pow(10, 1 / 3), 0); // 1000 * 2.154 = 2154
  });
});
