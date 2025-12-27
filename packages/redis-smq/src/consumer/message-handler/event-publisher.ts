/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageHandler } from './message-handler.js';
import { EventMultiplexer } from '../../event-bus/event-multiplexer.js';

export function eventPublisher(messageHandler: MessageHandler): void {
  messageHandler.on('consumer.messageHandler.error', (...args) =>
    EventMultiplexer.publish('consumer.messageHandler.error', ...args),
  );
}
