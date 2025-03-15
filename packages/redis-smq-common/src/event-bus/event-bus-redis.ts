/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async } from '../async/index.js';
import { ICallback } from '../common/index.js';
import { EventEmitter, IEventBus, TEventBusEvent } from '../event/index.js';
import {
  createRedisClient,
  IRedisClient,
  IRedisConfig,
} from '../redis-client/index.js';
import { EventBusNotConnectedError } from './errors/index.js';

export class EventBusRedis<Events extends TEventBusEvent>
  extends EventEmitter<Events>
  implements IEventBus<Events>
{
  protected connected = false;
  protected pubClient;
  protected subClient;

  protected constructor(pubClient: IRedisClient, subClient: IRedisClient) {
    super();

    //
    this.pubClient = pubClient;
    this.pubClient.on('error', (err: Error) => {
      this.eventEmitter.emit('error', err);
    });

    //
    this.subClient = subClient;
    this.subClient.on('message', (channel: keyof Events, message: string) => {
      this.eventEmitter.emit(String(channel), ...JSON.parse(message));
    });
    this.subClient.on('error', (err: Error) => {
      this.eventEmitter.emit('error', err);
    });

    this.connected = true;
  }

  override emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean {
    if (!this.connected) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return false;
    }
    this.pubClient.publish(String(event), JSON.stringify(args), () => void 0);
    return true;
  }

  override on<E extends keyof Events>(event: E, listener: Events[E]): this {
    if (event === 'error') {
      super.on('error', listener);
      return this;
    }
    if (!this.connected) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return this;
    }
    this.subClient.subscribe(String(event));
    super.on(event, listener);
    return this;
  }

  override once<E extends keyof Events>(event: E, listener: Events[E]): this {
    if (event === 'error') {
      super.once('error', listener);
      return this;
    }
    if (!this.connected) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return this;
    }
    this.subClient.subscribe(String(event));
    super.once(event, listener);
    return this;
  }

  override removeAllListeners<E extends keyof Events>(
    event?: Extract<E, string>,
  ): this {
    if (event === 'error') {
      super.removeAllListeners('error');
      return this;
    }
    if (!this.connected) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return this;
    }
    if (event) this.subClient.unsubscribe(String(event));
    else this.subClient.unsubscribe();
    super.removeAllListeners(event);
    return this;
  }

  override removeListener<E extends keyof Events>(
    event: E,
    listener: Events[E],
  ): this {
    if (event === 'error') {
      super.removeListener('error', listener);
      return this;
    }
    if (!this.connected) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return this;
    }
    super.removeListener(event, listener);
    return this;
  }

  shutdown(cb: ICallback<void>) {
    if (this.connected) {
      async.waterfall(
        [
          (cb: ICallback<void>) => this.subClient.halt(() => cb()),
          (cb: ICallback<void>) => this.pubClient.halt(() => cb()),
        ],
        () => {
          this.connected = false;
          cb();
        },
      );
    } else cb();
  }

  static createInstance<T extends TEventBusEvent>(
    config: IRedisConfig,
    cb: ICallback<IEventBus<T>>,
  ): void {
    let pubClient: IRedisClient | null | undefined = null;
    let subClient: IRedisClient | null | undefined = null;
    async.waterfall(
      [
        (cb: ICallback<void>) =>
          createRedisClient(config, (err, client) => {
            if (err) cb(err);
            else {
              pubClient = client;
              cb();
            }
          }),
        (cb: ICallback<void>) =>
          createRedisClient(config, (err, client) => {
            if (err) cb(err);
            else {
              subClient = client;
              cb();
            }
          }),
      ],
      (err) => {
        if (err) {
          if (pubClient) pubClient.halt(() => void 0);
          if (subClient) subClient.halt(() => void 0);
          cb(err);
        } else if (!pubClient || !subClient) cb(new Error());
        else {
          const instance = new EventBusRedis<T>(pubClient, subClient);
          cb(null, instance);
        }
      },
    );
  }
}
