/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer } from './consumer.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';

export function eventPublisher(consumer: Consumer): void {
  consumer.on('consumer.goingDown', (...args) =>
    EventMultiplexer.publish('consumer.goingDown', ...args),
  );
  consumer.on('consumer.goingUp', (...args) =>
    EventMultiplexer.publish('consumer.goingUp', ...args),
  );
  consumer.on('consumer.up', (...args) =>
    EventMultiplexer.publish('consumer.up', ...args),
  );
  consumer.on('consumer.down', (...args) =>
    EventMultiplexer.publish('consumer.down', ...args),
  );
  consumer.on('consumer.error', (...args) =>
    EventMultiplexer.publish('consumer.error', ...args),
  );
}
