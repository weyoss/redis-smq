/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TConsumerMessageHandlerRunnerEvent } from '../../common/index.js';
import { EventBus } from '../../event-bus/index.js';
import { MessageHandlerRunner } from './message-handler-runner.js';

export function eventBusPublisher(
  messageHandlerRunner: MessageHandlerRunner,
): void {
  const error: TConsumerMessageHandlerRunnerEvent['consumer.messageHandlerRunner.error'] =
    (...args) => {
      const instance = EventBus.getInstance();
      instance.emit('consumer.messageHandlerRunner.error', ...args);
    };
  messageHandlerRunner.on('consumer.messageHandlerRunner.error', error);
}
