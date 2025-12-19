/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TConsumerDequeueMessageEvent } from '../../../common/index.js';
import { EventBus } from '../../../event-bus/index.js';
import { DequeueMessage } from './dequeue-message.js';

export function eventBusPublisher(dequeueMessage: DequeueMessage): void {
  const messageReceived: TConsumerDequeueMessageEvent['consumer.dequeueMessage.messageReceived'] =
    (...args) => {
      const instance = EventBus.getInstance();
      instance.emit('consumer.dequeueMessage.messageReceived', ...args);
    };
  const nextMessage: TConsumerDequeueMessageEvent['consumer.dequeueMessage.nextMessage'] =
    (...args) => {
      const instance = EventBus.getInstance();
      instance.emit('consumer.dequeueMessage.nextMessage', ...args);
    };
  const error: TConsumerDequeueMessageEvent['consumer.dequeueMessage.error'] = (
    ...args
  ) => {
    const instance = EventBus.getInstance();
    instance.emit('consumer.dequeueMessage.error', ...args);
  };
  dequeueMessage
    .on('consumer.dequeueMessage.messageReceived', messageReceived)
    .on('consumer.dequeueMessage.nextMessage', nextMessage)
    .on('consumer.dequeueMessage.error', error);
}
