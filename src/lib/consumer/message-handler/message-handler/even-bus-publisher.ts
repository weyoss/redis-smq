/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { TConsumerMessageHandlerEvent } from '../../../../common/index.js';
import { EventBusRedisFactory } from '../../../event-bus/event-bus-redis-factory.js';
import { MessageHandler } from './message-handler.js';

export function evenBusPublisher(
  messageHandler: MessageHandler,
  consumerId: string,
  logger: ILogger,
): void {
  const eventBus = EventBusRedisFactory(consumerId, () => void 0);
  const error: TConsumerMessageHandlerEvent['consumer.messageHandler.error'] = (
    ...args
  ) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.messageHandler.error', ...args);
  };
  messageHandler.on('consumer.messageHandler.error', error);
}
