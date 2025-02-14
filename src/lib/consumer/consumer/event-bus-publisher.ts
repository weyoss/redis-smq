/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { TConsumerEvent } from '../../../common/index.js';
import { EventBus } from '../../event-bus/index.js';
import { Consumer } from './consumer.js';

export function eventBusPublisher(
  consumer: Consumer,
  eventBus: EventBus,
  logger: ILogger,
): void {
  const up: TConsumerEvent['consumer.up'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.up', ...args);
  };
  const down: TConsumerEvent['consumer.down'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.down', ...args);
  };
  const goingUp: TConsumerEvent['consumer.goingUp'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.goingUp', ...args);
  };
  const goingDown: TConsumerEvent['consumer.goingDown'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.goingDown', ...args);
  };
  const error: TConsumerEvent['consumer.error'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('consumer.error', ...args);
  };
  consumer.on('consumer.goingDown', goingDown);
  consumer.on('consumer.goingUp', goingUp);
  consumer.on('consumer.up', up);
  consumer.on('consumer.down', down);
  consumer.on('consumer.error', error);
}
