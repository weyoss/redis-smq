/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { TProducerEvent } from '../../common/index.js';
import { EventBus } from '../../common/event-bus/event-bus.js';
import { Producer } from './producer.js';

export function eventBusPublisher(
  producer: Producer,
  eventBus: EventBus,
  logger: ILogger,
): void {
  const up: TProducerEvent['producer.up'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('producer.up', ...args);
  };
  const down: TProducerEvent['producer.down'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('producer.down', ...args);
  };
  const goingUp: TProducerEvent['producer.goingUp'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('producer.goingUp', ...args);
  };
  const goingDown: TProducerEvent['producer.goingDown'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('producer.goingDown', ...args);
  };
  const messagePublished: TProducerEvent['producer.messagePublished'] = (
    ...args
  ) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('producer.messagePublished', ...args);
  };
  const error: TProducerEvent['producer.error'] = (...args) => {
    const instance = eventBus.getInstance();
    if (instance instanceof Error) logger.error(instance);
    else instance.emit('producer.error', ...args);
  };
  producer.on('producer.goingDown', goingDown);
  producer.on('producer.goingUp', goingUp);
  producer.on('producer.up', up);
  producer.on('producer.down', down);
  producer.on('producer.messagePublished', messagePublished);
  producer.on('producer.error', error);
}
