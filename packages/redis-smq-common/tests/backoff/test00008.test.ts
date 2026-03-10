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
import { LogarithmicBackoff } from '../../src/backoff/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

class CustomBackoff extends LogarithmicBackoff {
  override getNextDelay(baseDelay: number, attempts: number): number {
    return super.getNextDelay(baseDelay, attempts);
  }
}

describe('LogarithmicBackoff: getNextDelay', () => {
  it('should calculate logarithmic delays correctly', () => {
    const backoff = new CustomBackoff(getDummyLogger());

    // Access the protected method for testing
    const getNextDelay = backoff.getNextDelay.bind(backoff);

    // Test values: baseDelay * log2(attempts + 2)
    expect(getNextDelay(1000, 0)).toBeCloseTo(1000 * Math.log2(2), 0); // 1000 * 1 = 1000
    expect(getNextDelay(1000, 1)).toBeCloseTo(1000 * Math.log2(3), 0); // 1000 * 1.585 = 1585
    expect(getNextDelay(1000, 2)).toBeCloseTo(1000 * Math.log2(4), 0); // 1000 * 2 = 2000
    expect(getNextDelay(1000, 3)).toBeCloseTo(1000 * Math.log2(5), 0); // 1000 * 2.322 = 2322
    expect(getNextDelay(1000, 4)).toBeCloseTo(1000 * Math.log2(6), 0); // 1000 * 2.585 = 2585
    expect(getNextDelay(1000, 5)).toBeCloseTo(1000 * Math.log2(7), 0); // 1000 * 2.807 = 2807
    expect(getNextDelay(1000, 6)).toBeCloseTo(1000 * Math.log2(8), 0); // 1000 * 3 = 3000
    expect(getNextDelay(1000, 7)).toBeCloseTo(1000 * Math.log2(9), 0); // 1000 * 3.17 = 3170
    expect(getNextDelay(1000, 8)).toBeCloseTo(1000 * Math.log2(10), 0); // 1000 * 3.322 = 3322
  });
});
