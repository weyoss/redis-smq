/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageError } from './message.error.js';

export class MessageDestinationQueueAlreadySetError extends MessageError {
  constructor() {
    super(`Destination queue is already set`);
  }
}
