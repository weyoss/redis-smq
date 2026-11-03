/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  ExponentialBackoff,
  LinearBackoff,
  LogarithmicBackoff,
  PolynomialBackoff,
} from '../../../src/backoff/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';

/**
 * The `getNextDelay` method is protected on the strategies — these thin
 * subclasses make it callable from tests without changing the source.
 */
class ExposedLogarithmic extends LogarithmicBackoff {
  override getNextDelay(base: number, attempts: number): number {
    return super.getNextDelay(base, attempts);
  }
}
class ExposedPolynomial extends PolynomialBackoff {
  override getNextDelay(base: number, attempts: number): number {
    return super.getNextDelay(base, attempts);
  }
}
class ExposedExponential extends ExponentialBackoff {
  override getNextDelay(base: number, attempts: number): number {
    return super.getNextDelay(base, attempts);
  }
}
class ExposedLinear extends LinearBackoff {
  override getNextDelay(base: number, attempts: number): number {
    return super.getNextDelay(base, attempts);
  }
}

describe('Backoff strategies: getNextDelay', () => {
  describe('LogarithmicBackoff — baseDelay * log2(attempts + 2)', () => {
    it.each([0, 1, 2, 3, 4, 5, 6, 7, 8])('attempts = %d', (attempts) => {
      const backoff = new ExposedLogarithmic(getDummyLogger());
      const expected = 1000 * Math.log2(attempts + 2);
      expect(backoff.getNextDelay(1000, attempts)).toBeCloseTo(expected, 0);
    });
  });

  describe('PolynomialBackoff — baseDelay * (attempts + 1)^(1/3)', () => {
    it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])('attempts = %d', (attempts) => {
      const backoff = new ExposedPolynomial(getDummyLogger());
      const expected = 1000 * Math.pow(attempts + 1, 1 / 3);
      expect(backoff.getNextDelay(1000, attempts)).toBeCloseTo(expected, 0);
    });
  });

  describe('ExponentialBackoff — baseDelay * factor^attempts', () => {
    it('uses factor 2 by default', () => {
      const backoff = new ExposedExponential(getDummyLogger());
      for (let attempts = 0; attempts <= 5; attempts++) {
        expect(backoff.getNextDelay(1000, attempts)).toBe(
          1000 * Math.pow(2, attempts),
        );
      }
    });

    it('honours a custom factor', () => {
      const backoff = new ExposedExponential(getDummyLogger(), { factor: 1.5 });
      // baseDelay * 1.5^attempts
      const expected = [1000, 1500, 2250, 3375, 5062.5, 7593.75];
      expected.forEach((value, attempts) => {
        expect(backoff.getNextDelay(1000, attempts)).toBe(value);
      });
    });
  });

  describe('LinearBackoff — baseDelay * attempts', () => {
    it.each([0, 1, 2, 3, 4, 5])('attempts = %d', (attempts) => {
      const backoff = new ExposedLinear(getDummyLogger());
      expect(backoff.getNextDelay(1000, attempts)).toBe(1000 * attempts);
    });
  });
});
