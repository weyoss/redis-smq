/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { EventBus } from '../../../../../common/event-bus/event-bus.js';
import { TConsumerConsumeMessageEvent } from '../../../../../common/index.js';
import { ConsumeMessage } from './consume-message.js';

export function eventBusPublisher(
  consumeMessage: ConsumeMessage,
  eventBus: EventBus,
  logger: ILogger,
): void {
  const messageDeadLettered: TConsumerConsumeMessageEvent['consumer.consumeMessage.messageDeadLettered'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else
        instance.emit('consumer.consumeMessage.messageDeadLettered', ...args);
    };
  const messageDelayed: TConsumerConsumeMessageEvent['consumer.consumeMessage.messageDelayed'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else instance.emit('consumer.consumeMessage.messageDelayed', ...args);
    };
  const messageRequeued: TConsumerConsumeMessageEvent['consumer.consumeMessage.messageRequeued'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else instance.emit('consumer.consumeMessage.messageRequeued', ...args);
    };
  const messageAcknowledged: TConsumerConsumeMessageEvent['consumer.consumeMessage.messageAcknowledged'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else
        instance.emit('consumer.consumeMessage.messageAcknowledged', ...args);
    };
  const messageUnacknowledged: TConsumerConsumeMessageEvent['consumer.consumeMessage.messageUnacknowledged'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else
        instance.emit('consumer.consumeMessage.messageUnacknowledged', ...args);
    };
  const error: TConsumerConsumeMessageEvent['consumer.consumeMessage.error'] = (
    ...args
  ) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.consumeMessage.error', ...args);
  };
  consumeMessage
    .on('consumer.consumeMessage.error', error)
    .on('consumer.consumeMessage.messageUnacknowledged', messageUnacknowledged)
    .on('consumer.consumeMessage.messageAcknowledged', messageAcknowledged)
    .on('consumer.consumeMessage.messageDeadLettered', messageDeadLettered)
    .on('consumer.consumeMessage.messageRequeued', messageRequeued)
    .on('consumer.consumeMessage.messageDelayed', messageDelayed);
}
