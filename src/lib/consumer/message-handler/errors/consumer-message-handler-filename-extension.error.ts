/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerMessageHandlerError } from './consumer-message-handler.error';

export class ConsumerMessageHandlerFilenameExtensionError extends ConsumerMessageHandlerError {
  constructor() {
    super(
      `Message handler filename must ends with a '.js' or '.cjs' extension depending on your project settings.`,
    );
  }
}
