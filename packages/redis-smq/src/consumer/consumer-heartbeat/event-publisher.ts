/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerHeartbeat } from './consumer-heartbeat.js';
import { EventMultiplexer } from '../../event-bus/event-multiplexer.js';

export function eventPublisher(consumerHeartbeat: ConsumerHeartbeat): void {
  consumerHeartbeat.on('consumerHeartbeat.heartbeat', (...args) =>
    EventMultiplexer.publish('consumerHeartbeat.heartbeat', ...args),
  );
}
