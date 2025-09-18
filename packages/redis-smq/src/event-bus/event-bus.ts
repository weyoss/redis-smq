/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventBusRedisFactory } from 'redis-smq-common';
import { Configuration } from '../config/index.js';
import { TRedisSMQEvent } from '../common/index.js';

export class EventBus extends EventBusRedisFactory<TRedisSMQEvent> {
  constructor() {
    const config = Configuration.getConfig();
    super(config.redis);
  }
}
