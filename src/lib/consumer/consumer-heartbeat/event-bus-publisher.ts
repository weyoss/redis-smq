/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { TConsumerHeartbeatEvent } from '../../../common/types/event.js';
import { EventBusRedisFactory } from '../../event-bus/event-bus-redis-factory.js';
import { ConsumerHeartbeat } from './consumer-heartbeat.js';

export function eventBusPublisher(
  consumerHeartbeat: ConsumerHeartbeat,
  consumerId: string,
  logger: ILogger,
): void {
  const eventBus = EventBusRedisFactory(consumerId, () => void 0);
  const onConsumerHeartbeat: TConsumerHeartbeatEvent['consumerHeartbeat.heartbeat'] =
    (...args) => {
      const instance = eventBus.getInstance();
      if (instance instanceof Error) logger.error(instance);
      else instance.emit('consumerHeartbeat.heartbeat', ...args);
    };
  consumerHeartbeat.on('consumerHeartbeat.heartbeat', onConsumerHeartbeat);
}
