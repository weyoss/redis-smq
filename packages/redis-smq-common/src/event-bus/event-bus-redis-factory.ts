/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../async/index.js';
import { CallbackEmptyReplyError, PanicError } from '../errors/index.js';
import { EventEmitter, TEventBusEvent } from '../event/index.js';
import { IRedisConfig, TRedisClientEvent } from '../redis-client/index.js';
import { EventBusInstanceLockError } from './errors/index.js';
import { EventBusRedis } from './event-bus-redis.js';
import { IEventBus } from './types/index.js';

export class EventBusRedisFactory<
  Event extends TEventBusEvent,
> extends EventEmitter<Pick<TRedisClientEvent, 'error'>> {
  protected instance: IEventBus<Event> | null = null;
  protected locked = false;
  protected config;

  constructor(config: IRedisConfig) {
    super();
    this.config = config;
  }

  init = (cb: ICallback<void>): void => {
    this.getSetInstance((err) => cb(err));
  };

  getInstance(): IEventBus<Event> | Error {
    if (!this.instance)
      return new PanicError(
        `Use first getSetInstance() to initialize the EventBusRedisInstance class`,
      );
    return this.instance;
  }

  getSetInstance(cb: ICallback<IEventBus<Event>>): void {
    if (!this.locked) {
      if (!this.instance) {
        this.locked = true;
        EventBusRedis.createInstance<Event>(this.config, (err, inst) => {
          this.locked = false;
          if (err) cb(err);
          else if (!inst) cb(new CallbackEmptyReplyError());
          else {
            this.instance = inst;
            this.instance.on('error', (err: Error) => this.emit('error', err));
            cb(null, this.instance);
          }
        });
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
