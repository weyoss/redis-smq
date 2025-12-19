/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TConsumerHeartbeatEvent } from '../../common/index.js';
import { ConsumerHeartbeat } from './consumer-heartbeat.js';
import { EventBus } from '../../event-bus/index.js';

export function eventBusPublisher(consumerHeartbeat: ConsumerHeartbeat): void {
  const onConsumerHeartbeat: TConsumerHeartbeatEvent['consumerHeartbeat.heartbeat'] =
    (...args) => {
      const instance = EventBus.getInstance();
      instance.emit('consumerHeartbeat.heartbeat', ...args);
    };
  consumerHeartbeat.on('consumerHeartbeat.heartbeat', onConsumerHeartbeat);
}
