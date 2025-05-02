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
import { EventEmitter } from '../event/index.js';
import { createRedisClient } from './create-redis-client.js';
import { InstanceLockError } from './errors/index.js';
import {
  IRedisClient,
  IRedisConfig,
  TRedisClientEvent,
} from './types/index.js';

export class RedisClientFactory extends EventEmitter<
  Pick<TRedisClientEvent, 'error'>
> {
  protected instance: IRedisClient | null = null;
  protected locked = false;
  protected config: IRedisConfig;

  constructor(config: IRedisConfig) {
    super();
    this.config = config;
  }

  protected createClient(
    config: IRedisConfig,
    cb: ICallback<IRedisClient>,
  ): void {
    createRedisClient(config, (err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());
      this.setupClient(client, cb);
    });
  }

  protected setupClient(client: IRedisClient, cb: ICallback<IRedisClient>) {
    cb(null, client);
  }

  init = (cb: ICallback<void>): void => {
    this.getSetInstance((err) => cb(err));
  };

  getSetInstance = (cb: ICallback<IRedisClient>): void => {
    if (!this.locked) {
      if (!this.instance) {
        this.locked = true;
        this.createClient(this.config, (err, client) => {
          this.locked = false;
          if (err) return cb(err);
          if (!client) return cb(new CallbackEmptyReplyError());
          this.instance = client;
          this.instance.on('error', (err) => this.emit('error', err));
          cb(null, this.instance);
        });
      } else cb(null, this.instance);
    } else cb(new InstanceLockError());
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
