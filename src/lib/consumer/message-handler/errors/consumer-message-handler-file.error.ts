/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerMessageHandlerError } from './consumer-message-handler.error';

export class ConsumerMessageHandlerFileError extends ConsumerMessageHandlerError {
  constructor() {
    super(
      `Make sure the message handler filename is an absolute file path pointing to an existing file in your project. `,
    );
  }
}
