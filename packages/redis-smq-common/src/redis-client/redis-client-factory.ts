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
import { InstanceLockError, RedisClientError } from './errors/index.js';
import {
  ERedisConfigClient,
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
    this.createRedisClient(config, (err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());
      this.setupClient(client, cb);
    });
  }

  protected setupClient(client: IRedisClient, cb: ICallback<IRedisClient>) {
    cb(null, client);
  }

  init = (cb: ICallback): void => {
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

  shutdown = (cb: ICallback): void => {
    if (this.instance) {
      this.instance.halt(() => {
        this.instance = null;
        cb();
      });
    } else cb();
  };

  getInstance(): IRedisClient {
    if (!this.instance)
      throw new PanicError(
        `Use first init() to initialize the RedisClientInstance class`,
      );
    return this.instance;
  }

  protected createNodeRedisClient(
    config: IRedisConfig,
    cb: ICallback<IRedisClient>,
  ): void {
    import('./clients/node-redis/node-redis-client.js')
      .then(({ NodeRedisClient }): void => {
        const client = new NodeRedisClient(config.options);
        cb(null, client);
      })
      .catch(() =>
        cb(
          new RedisClientError(
            'REDIS client is not available. Please install node-redis.',
          ),
        ),
      );
  }

  protected createIORedisClient(
    config: IRedisConfig,
    cb: ICallback<IRedisClient>,
  ): void {
    import('./clients/ioredis/ioredis-client.js')
      .then(({ IoredisClient }): void => {
        const client = new IoredisClient(config.options);
        cb(null, client);
      })
      .catch(() =>
        cb(
          new RedisClientError(
            'IOREDIS client is not available. Please install ioredis.',
          ),
        ),
      );
  }

  protected initializeRedisClient(
    config: IRedisConfig,
    cb: ICallback<IRedisClient>,
  ): void {
    if (config.client === ERedisConfigClient.REDIS) {
      return this.createNodeRedisClient(config, cb);
    }
    if (config.client === ERedisConfigClient.IOREDIS) {
      return this.createIORedisClient(config, cb);
    }
    cb(
      new RedisClientError(
        'Unsupported Redis client type. Supported types are: REDIS, IOREDIS.',
      ),
    );
  }

  protected createRedisClient(
    config: IRedisConfig,
    cb: ICallback<IRedisClient>,
  ): void {
    this.initializeRedisClient(config, (err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());
      const onReady = () => {
        removeListeners();
        cb(null, client);
      };
      const onError = (err: Error) => {
        removeListeners();
        cb(err);
      };
      const removeListeners = () => {
        client.removeListener('ready', onReady);
        client.removeListener('error', onError);
      };
      client.once('ready', onReady);
      client.once('error', onError);
    });
  }
}
