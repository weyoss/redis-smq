/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumeMessage } from './consume-message.js';
import { EventMultiplexer } from '../../../event-bus/event-multiplexer.js';

export function eventPublisher(consumeMessage: ConsumeMessage): void {
  consumeMessage
    .on('messageUnacknowledged', (...args) =>
      EventMultiplexer.publish('consumer.messageUnacknowledged', ...args),
    )
    .on('messageAcknowledged', (...args) =>
      EventMultiplexer.publish('consumer.messageAcknowledged', ...args),
    )
    .on('messageDeadLettered', (...args) =>
      EventMultiplexer.publish('consumer.messageDeadLettered', ...args),
    )
    .on('messageRequeued', (...args) =>
      EventMultiplexer.publish('consumer.messageRequeued', ...args),
    )
    .on('messageDelayed', (...args) =>
      EventMultiplexer.publish('consumer.messageDelayed', ...args),
    );
}
