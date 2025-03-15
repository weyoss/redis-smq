/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { PanicError } from './panic.error.js';

export class CallbackEmptyReplyError extends PanicError {
  constructor() {
    super(`Expected a non-empty reply`);
  }
}
