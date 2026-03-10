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
import { LinearBackoff } from '../../src/backoff/index.js';
import { getDummyLogger } from '../../src/logger/index.js';

class CustomBackoff extends LinearBackoff {
  override getNextDelay(baseDelay: number, attempts: number): number {
    return super.getNextDelay(baseDelay, attempts);
  }
}

describe('ExponentialBackoff: getNextDelay', () => {
  it('should calculate linear delays correctly', () => {
    const backoff = new CustomBackoff(getDummyLogger());

    const getNextDelay = backoff.getNextDelay.bind(backoff);

    // Test values: baseDelay * attempts
    expect(getNextDelay(1000, 0)).toBe(0); // 1000 * 0 = 0
    expect(getNextDelay(1000, 1)).toBe(1000); // 1000 * 1 = 1000
    expect(getNextDelay(1000, 2)).toBe(2000); // 1000 * 2 = 2000
    expect(getNextDelay(1000, 3)).toBe(3000); // 1000 * 3 = 3000
    expect(getNextDelay(1000, 4)).toBe(4000); // 1000 * 4 = 4000
    expect(getNextDelay(1000, 5)).toBe(5000); // 1000 * 5 = 5000
  });
});
