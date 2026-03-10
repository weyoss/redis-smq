/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Backoff } from './backoff.js';

export class LinearBackoff extends Backoff {
  protected getNextDelay(baseDelay: number, attempts: number): number {
    return baseDelay * attempts;
  }
}
