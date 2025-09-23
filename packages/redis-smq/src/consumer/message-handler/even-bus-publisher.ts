/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TConsumerMessageHandlerEvent } from '../../common/index.js';
import { EventBus } from '../../event-bus/index.js';
import { MessageHandler } from './message-handler.js';

export function evenBusPublisher(messageHandler: MessageHandler): void {
  const error: TConsumerMessageHandlerEvent['consumer.messageHandler.error'] = (
    ...args
  ) => {
    const instance = EventBus.getInstance();
    instance.emit('consumer.messageHandler.error', ...args);
  };
  messageHandler.on('consumer.messageHandler.error', error);
}
