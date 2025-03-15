/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { WorkerError } from './worker-error.js';

export class WorkerAlreadyDownError extends WorkerError {
  constructor() {
    super(`Worker is going/already down`);
  }
}
