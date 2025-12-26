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
  dequeueMessage
    .on('consumer.dequeueMessage.messageReceived', (...args) =>
      EventMultiplexer.publish(
        'consumer.dequeueMessage.messageReceived',
        ...args,
      ),
    )
    .on('consumer.dequeueMessage.nextMessage', (...args) =>
      EventMultiplexer.publish('consumer.dequeueMessage.nextMessage', ...args),
    )
    .on('consumer.dequeueMessage.error', (...args) =>
      EventMultiplexer.publish('consumer.dequeueMessage.error', ...args),
    );
}
