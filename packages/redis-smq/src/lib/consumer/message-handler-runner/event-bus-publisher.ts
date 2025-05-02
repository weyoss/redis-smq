/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { TConsumerMessageHandlerRunnerEvent } from '../../../common/index.js';
import { EventBus } from '../../../common/event-bus/event-bus.js';
import { MessageHandlerRunner } from './message-handler-runner.js';

export function eventBusPublisher(
  messageHandlerRunner: MessageHandlerRunner,
  eventBus: EventBus,
  logger: ILogger,
): void {
  const error: TConsumerMessageHandlerRunnerEvent['consumer.messageHandlerRunner.error'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else instance.emit('consumer.messageHandlerRunner.error', ...args);
    };
  messageHandlerRunner.on('consumer.messageHandlerRunner.error', error);
}
