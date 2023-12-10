/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageError } from './message.error';

export class MessageDeleteError extends MessageError {
  constructor(msg?: string) {
    super(msg ?? `MESSAGE_DELETE_ERROR`);
  }
}
