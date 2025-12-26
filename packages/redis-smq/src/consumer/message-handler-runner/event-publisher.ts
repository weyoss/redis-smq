/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageHandlerRunner } from './message-handler-runner.js';
import { EventMultiplexer } from '../../event-bus/event-multiplexer.js';

export function eventPublisher(
  messageHandlerRunner: MessageHandlerRunner,
): void {
  messageHandlerRunner.on('consumer.messageHandlerRunner.error', (...args) =>
    EventMultiplexer.publish('consumer.messageHandlerRunner.error', ...args),
  );
}
