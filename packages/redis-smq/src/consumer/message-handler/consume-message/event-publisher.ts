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
    .on('consumer.consumeMessage.error', (...args) =>
      EventMultiplexer.publish('consumer.consumeMessage.error', ...args),
    )
    .on('consumer.consumeMessage.messageUnacknowledged', (...args) =>
      EventMultiplexer.publish(
        'consumer.consumeMessage.messageUnacknowledged',
        ...args,
      ),
    )
    .on('consumer.consumeMessage.messageAcknowledged', (...args) =>
      EventMultiplexer.publish(
        'consumer.consumeMessage.messageAcknowledged',
        ...args,
      ),
    )
    .on('consumer.consumeMessage.messageDeadLettered', (...args) =>
      EventMultiplexer.publish(
        'consumer.consumeMessage.messageDeadLettered',
        ...args,
      ),
    )
    .on('consumer.consumeMessage.messageRequeued', (...args) =>
      EventMultiplexer.publish(
        'consumer.consumeMessage.messageRequeued',
        ...args,
      ),
    )
    .on('consumer.consumeMessage.messageDelayed', (...args) =>
      EventMultiplexer.publish(
        'consumer.consumeMessage.messageDelayed',
        ...args,
      ),
    );
}
