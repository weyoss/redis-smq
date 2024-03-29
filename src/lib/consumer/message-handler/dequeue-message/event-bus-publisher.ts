/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { TConsumerDequeueMessageEvent } from '../../../../common/index.js';
import { EventBusRedisFactory } from '../../../event-bus/event-bus-redis-factory.js';
import { DequeueMessage } from './dequeue-message.js';

export function eventBusPublisher(
  dequeueMessage: DequeueMessage,
  consumerId: string,
  logger: ILogger,
): void {
  const eventBus = EventBusRedisFactory(consumerId, () => void 0);
  const messageReceived: TConsumerDequeueMessageEvent['consumer.dequeueMessage.messageReceived'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else instance.emit('consumer.dequeueMessage.messageReceived', ...args);
    };
  const nextMessage: TConsumerDequeueMessageEvent['consumer.dequeueMessage.nextMessage'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else instance.emit('consumer.dequeueMessage.nextMessage', ...args);
    };
  const error: TConsumerDequeueMessageEvent['consumer.dequeueMessage.error'] = (
    ...args
  ) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.dequeueMessage.error', ...args);
  };
  dequeueMessage
    .on('consumer.dequeueMessage.messageReceived', messageReceived)
    .on('consumer.dequeueMessage.nextMessage', nextMessage)
    .on('consumer.dequeueMessage.error', error);
}
