/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
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

      // On setupClient failure the client is already connected — no one
      // will hold a reference to it, and without halting here its socket
      // leaks for the lifetime of the process. Halt first, then propagate
      // the setup error (which is what the caller actually needs to see).
      try {
        this.setupClient(client, (setupErr, setupClient) => {
          if (setupErr) {
            client.halt(() => cb(setupErr));
            return;
          }
          cb(null, setupClient);
        });
      } catch (syncErr) {
        const e =
          syncErr instanceof Error ? syncErr : new Error(String(syncErr));
        client.halt(() => cb(e));
      }
    });
  }

  protected setupClient(client: IRedisClient, cb: ICallback<IRedisClient>) {
    cb(null, client);
  }

  init = (cb: ICallback): void => {
    this.getSetInstance((err) => cb(err));
  };

  /**
   * Attach an `'error'` listener ONLY if at least one is registered on the
   * factory.
   *
   * Node's `EventEmitter` throws when `'error'` is emitted with no listener
   * attached. Raw Redis clients retry indefinitely and emit `'error'` on
   * every failed attempt. When the factory has no consumer listening — e.g.
   * between construction and the first `factory.on('error', ...)`, or
   * during a raw-client retry window before `init()` resolves — an
   * unguarded emit crashes the process for a condition the framework has
   * already decided is recoverable. The guard prevents that.
   */
  protected onClientError = (err: Error): void => {
    if (this.listenerCount('error') > 0) {
      this.emit('error', err);
    }
  };

  /**
   * Returns the client instance, initializing it first if necessary.
   *
   * Concurrent calls: the first caller locks the factory, creates the
   * client, and unlocks when done. Subsequent callers during the locked
   * window receive `InstanceLockError` — this is fail-fast, not queueing.
   * Callers that expect concurrency should either serialize their init
   * calls or handle `InstanceLockError` and retry.
   *
   * For a non-initializing accessor, use `getInstance()` instead — it
   * returns the already-initialized client and throws `PanicError` if
   * `init()` has not yet succeeded.
   */
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

  /**
   * Returns the connected client.
   *
   * @throws {PanicError} if `init()` has not yet succeeded. This is a
   *   programming error — a caller who needs the client should call
   *   `init()` first, or use `getSetInstance()` (which initializes on
   *   demand). Calling `getInstance()` before init is a lifecycle bug,
   *   not a recoverable state.
   */
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

  /**
   * Create the raw client, then wait for its `'ready'` event (i.e. `init()`
   * succeeded — version validated, built-in scripts loaded) before
   * resolving. Any error before ready rejects the callback.
   *
   * Note: the wrapper emits `'ready'` only AFTER `init()` completes, not
   * on raw socket-connect. This guarantees the caller receives a fully
   * operational client, not just a connected socket.
   */
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
