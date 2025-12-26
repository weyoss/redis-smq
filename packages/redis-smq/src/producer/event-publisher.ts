/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Producer } from './producer.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';

export function eventPublisher(producer: Producer): void {
  producer.on('producer.goingDown', (...args) =>
    EventMultiplexer.publish('producer.goingDown', ...args),
  );
  producer.on('producer.goingUp', (...args) =>
    EventMultiplexer.publish('producer.goingUp', ...args),
  );
  producer.on('producer.up', (...args) =>
    EventMultiplexer.publish('producer.up', ...args),
  );
  producer.on('producer.down', (...args) =>
    EventMultiplexer.publish('producer.down', ...args),
  );
  producer.on('producer.messagePublished', (...args) =>
    EventMultiplexer.publish('producer.messagePublished', ...args),
  );
  producer.on('producer.error', (...args) =>
    EventMultiplexer.publish('producer.error', ...args),
  );
}
