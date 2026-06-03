/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { DequeueMessage } from './dequeue-message.js';
import { EventMultiplexer } from '../../../event-bus/event-multiplexer.js';

export function eventPublisher(dequeueMessage: DequeueMessage): void {
  dequeueMessage.on('messageReceived', (...args) =>
    EventMultiplexer.publish('consumer.messageReceived', ...args),
  );
}
