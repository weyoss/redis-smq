/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FileLockError } from './file-lock.error.js';

export class FileLockAttemptsExhaustedError extends FileLockError {
  constructor(lockFile: string, retries: number) {
    super(`Failed to acquire lock on ${lockFile} after ${retries} attempts`);
  }
}
