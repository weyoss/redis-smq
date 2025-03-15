/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { LockError } from './lock.error.js';

export class LockAcquireError extends LockError {
  constructor(message = `Could not acquire a lock`) {
    super(message);
  }
}
