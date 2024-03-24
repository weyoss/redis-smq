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
  createRedisClient,
  EventEmitter,
  ICallback,
  IRedisClient,
  PanicError,
  TRedisClientEvent,
} from 'redis-smq-common';
import { Configuration } from '../../config/index.js';
import { RedisClientInstanceLockError } from './errors/redis-client-instance-lock.error.js';

export class RedisClientInstance extends EventEmitter<
  Pick<TRedisClientEvent, 'error'>
> {
  protected instance: IRedisClient | null = null;
  protected locked = false;

  init = (cb: ICallback<void>): void => {
    this.getSetInstance((err) => cb(err));
  };

  getSetInstance = (cb: ICallback<IRedisClient>): void => {
    if (!this.locked) {
      if (!this.instance) {
        this.locked = true;
        createRedisClient(Configuration.getSetConfig().redis, (err, client) => {
          this.locked = false;
          if (err) cb(err);
          else if (!client) cb(new CallbackEmptyReplyError());
          else {
            this.instance = client;
            this.instance.on('error', (err) => this.emit('error', err));
            cb(null, this.instance);
          }
        });
      } else cb(null, this.instance);
    } else cb(new RedisClientInstanceLockError());
  };

  shutdown = (cb: ICallback<void>): void => {
    if (this.instance) {
      this.instance.halt(() => {
        this.instance = null;
        cb();
      });
    } else cb();
  };

  getInstance(): IRedisClient | Error {
    if (!this.instance)
      return new PanicError(
        `Use first getSetInstance() to initialize the RedisClientInstance class`,
      );
    return this.instance;
  }
}
