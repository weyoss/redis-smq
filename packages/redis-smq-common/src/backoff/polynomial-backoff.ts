/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Backoff } from './backoff.js';

export class PolynomialBackoff extends Backoff {
  protected getNextDelay(baseDelay: number, attempts: number): number {
    // Cubic root: grows slowly and smoothly
    return baseDelay * Math.pow(attempts + 1, 1 / 3);
  }
}
