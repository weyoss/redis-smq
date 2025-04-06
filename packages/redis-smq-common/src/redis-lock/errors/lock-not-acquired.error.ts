/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { LockError } from './lock.error.js';

export class LockNotAcquiredError extends LockError {
  constructor(
    message = `Can not extend a lock which has not been yet acquired. Maybe a pending operation is in progress.`,
  ) {
    super(message);
  }
}
