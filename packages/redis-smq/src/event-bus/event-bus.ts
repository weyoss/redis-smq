/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Configuration } from '../config/index.js';
import { TRedisSMQEvent } from '../common/index.js';
import { EventBusRedis, ICallback } from 'redis-smq-common';

export class EventBus {
  private static instance: EventBusRedis<TRedisSMQEvent> | null = null;

  protected constructor() {}

  static getInstance() {
    if (!EventBus.instance) {
      const config = Configuration.getConfig();
      EventBus.instance = new EventBusRedis<TRedisSMQEvent>(config);
    }
    return EventBus.instance;
  }

  static shutdown(cb: ICallback) {
    if (EventBus.instance) return EventBus.instance.shutdown(cb);
    cb();
  }
}
