/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TConsumerEvent } from '../../common/index.js';
import { Consumer } from '../consumer.js';
import { EventBus } from '../../event-bus/index.js';

export function eventBusPublisher(consumer: Consumer): void {
  const up: TConsumerEvent['consumer.up'] = (...args) => {
    const instance = EventBus.getInstance();
    instance.emit('consumer.up', ...args);
  };
  const down: TConsumerEvent['consumer.down'] = (...args) => {
    const instance = EventBus.getInstance();
    instance.emit('consumer.down', ...args);
  };
  const goingUp: TConsumerEvent['consumer.goingUp'] = (...args) => {
    const instance = EventBus.getInstance();
    instance.emit('consumer.goingUp', ...args);
  };
  const goingDown: TConsumerEvent['consumer.goingDown'] = (...args) => {
    const instance = EventBus.getInstance();
    instance.emit('consumer.goingDown', ...args);
  };
  const error: TConsumerEvent['consumer.error'] = (...args) => {
    const instance = EventBus.getInstance();
    instance.emit('consumer.error', ...args);
  };
  consumer.on('consumer.goingDown', goingDown);
  consumer.on('consumer.goingUp', goingUp);
  consumer.on('consumer.up', up);
  consumer.on('consumer.down', down);
  consumer.on('consumer.error', error);
}
