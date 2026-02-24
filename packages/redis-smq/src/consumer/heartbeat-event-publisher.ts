/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventMultiplexer } from '../event-bus/event-multiplexer.js';
import { Heartbeat } from 'redis-smq-common';
import { IHeartbeatPayload } from '../common/index.js';

export function heartbeatEventPublisher(
  heartbeat: Heartbeat<IHeartbeatPayload>,
): void {
  heartbeat.on('heartbeat.beat', (componentId, _, timestamp, payload) =>
    EventMultiplexer.publish(
      'consumerHeartbeat.heartbeat',
      componentId,
      timestamp,
      payload.data,
    ),
  );
}
