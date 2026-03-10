/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../../src/async/index.js';
import { Backoff } from '../../../src/backoff/backoff.js';

export class TestBackoff extends Backoff {
  override attempts = 0;

  override getNextDelay(baseDelay: number, attempts: number): number {
    return baseDelay * attempts;
  }

  override calculateNextDelay(): number {
    return super.calculateNextDelay();
  }

  override scheduleRetry<T>(
    task: (cb: ICallback<T>) => void,
    callback: ICallback<T>,
  ): void {
    super.scheduleRetry(task, callback);
  }
}
