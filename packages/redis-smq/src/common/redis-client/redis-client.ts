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
  IRedisConfig,
  PanicError,
  TRedisClientEvent,
} from 'redis-smq-common';
import { Configuration } from '../../config/index.js';
import { RedisClientInstanceLockError } from './errors/redis-client-instance-lock.error.js';
import { loadScriptFiles } from './scripts/scripts.js';

export class RedisClient extends EventEmitter<
  Pick<TRedisClientEvent, 'error'>
> {
  protected instance: IRedisClient | null = null;
  protected locked = false;

  protected createClient(
    config: IRedisConfig,
    cb: ICallback<IRedisClient>,
  ): void {
    createRedisClient(config, (err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());
      loadScriptFiles(client, (err) => {
        if (err) return cb(err);
        cb(null, client);
      });
    });
  }

  init = (cb: ICallback<void>): void => {
    this.getSetInstance((err) => cb(err));
  };

  getSetInstance = (cb: ICallback<IRedisClient>): void => {
    if (!this.locked) {
      if (!this.instance) {
        this.locked = true;
        this.createClient(Configuration.getSetConfig().redis, (err, client) => {
          this.locked = false;
          if (err) return cb(err);
          if (!client) return cb(new CallbackEmptyReplyError());
          this.instance = client;
          this.instance.on('error', (err) => this.emit('error', err));
          cb(null, this.instance);
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
