/*
 * packages/redis-smq-common/src/redis-client/redis-client-factory.ts
 */

import { ICallback } from '../async/index.js';
import { CallbackEmptyReplyError, PanicError } from '../errors/index.js';
import { EventEmitter } from '../event/index.js';
import { InstanceLockError } from './errors/index.js';
import {
  ERedisConfigClient,
  IRedisClient,
  IRedisConfig,
  TRedisClientEvent,
} from './types/index.js';
import {
  UnsupportedClientError,
  RedisClientNotInstalledError,
} from './errors/index.js';

export class RedisClientFactory extends EventEmitter<
  Pick<TRedisClientEvent, 'error'>
> {
  protected instance: IRedisClient | null = null;
  protected locked = false;
  protected config: IRedisConfig;

  // private static nextId = 0;
  // private readonly id: number;

  constructor(config: IRedisConfig) {
    super();
    this.config = config;
    // this.id = ++RedisClientFactory.nextId;
    // console.error(
    //   `[redis-factory] created id=${this.id} port=${(config.options as { port?: number }).port}`,
    // );
    // console.error(
    //   new Error().stack?.split('\n').slice(2, 10).join('\n') ?? '(no stack)',
    // );
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

  protected onClientError = (err: Error): void => {
    // Match ioredis's own behavior: an unhandled 'error' is informational,
    // not fatal. The client is already being torn down or has been
    // orphaned; there is no listener to handle the error and no one to
    // report it to. Throwing here terminates the process for a condition
    // the framework has already decided is recoverable.
    // const count = this.instance?.listenerCount('error') ?? 0;
    // if (count > 0) {
    //   this.emit('error', err);
    // }

    this.emit('error', err);
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
          this.instance.on('error', this.onClientError);
          cb(null, this.instance);
        });
      } else cb(null, this.instance);
    } else cb(new InstanceLockError());
  };

  shutdown = (cb: ICallback): void => {
    if (this.instance) {
      this.instance.removeListener('error', this.onClientError);
      this.instance.halt(() => {
        this.instance = null;
        cb();
      });
    } else cb();
  };

  getInstance(): IRedisClient {
    if (!this.instance)
      throw new PanicError({
        message: 'Use first init() to initialize the RedisClientInstance class',
      });
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
          new RedisClientNotInstalledError({
            metadata: { clientId: '@redis/client' },
          }),
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
          new RedisClientNotInstalledError({
            metadata: { clientId: 'ioredis' },
          }),
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
    cb(new UnsupportedClientError());
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
