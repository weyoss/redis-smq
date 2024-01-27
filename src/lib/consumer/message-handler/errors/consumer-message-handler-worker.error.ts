/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TWorkerThreadMessage } from '../consume-message-worker-thread';
import { ConsumerMessageHandlerError } from './consumer-message-handler.error';

export class ConsumerMessageHandlerWorkerError extends ConsumerMessageHandlerError {
  constructor(msg: TWorkerThreadMessage) {
    const { code, error } = msg;
    super(
      `Error code: ${code}.${
        error ? `Message: ${error.name}: ${error.message}` : ''
      }`,
    );
  }
}
