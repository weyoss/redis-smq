/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  EventBusRedis,
  EventEmitter,
  ICallback,
  IEventBus,
  PanicError,
  TRedisClientEvent,
} from 'redis-smq-common';
import { TRedisSMQEvent } from '../../common/index.js';
import { Configuration } from '../../config/index.js';
import { EventBusInstanceLockError } from './errors/index.js';

export class EventBusRedisInstance extends EventEmitter<
  Pick<TRedisClientEvent, 'error'>
> {
  protected instance: IEventBus<TRedisSMQEvent> | null = null;
  protected locked = false;

  init = (cb: ICallback<void>): void => {
    this.getSetInstance((err) => cb(err));
  };

  getInstance(): IEventBus<TRedisSMQEvent> | Error {
    if (!this.instance)
      return new PanicError(
        `Use first getSetInstance() to initialize the EventBusRedisInstance class`,
      );
    return this.instance;
  }

  getSetInstance(cb: ICallback<IEventBus<TRedisSMQEvent>>): void {
    if (!this.locked) {
      if (!this.instance) {
        this.locked = true;
        const redisConfig = Configuration.getSetConfig().redis;
        EventBusRedis.createInstance<TRedisSMQEvent>(
          redisConfig,
          (err, inst) => {
            this.locked = false;
            if (err) cb(err);
            else if (!inst) cb(new CallbackEmptyReplyError());
            else {
              this.instance = inst;
              this.instance.on('error', (err: Error) =>
                this.emit('error', err),
              );
              cb(null, this.instance);
            }
          },
        );
      } else cb(null, this.instance);
    } else cb(new EventBusInstanceLockError());
  }

  shutdown = (cb: ICallback<void>): void => {
    if (this.instance) {
      this.instance.removeAllListeners();
      this.instance.shutdown(() => {
        this.instance = null;
        cb();
      });
    } else cb();
  };
}
