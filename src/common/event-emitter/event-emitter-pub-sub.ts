/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EventEmitter,
  RedisClient,
  TEventEmitterEvent,
} from 'redis-smq-common';

export class EventEmitterPubSub<
  Events extends TEventEmitterEvent,
> extends EventEmitter<Events> {
  protected pubClient;
  protected subClient;
  protected eventHandlers: Partial<Events> = {};

  constructor(pubClient: RedisClient, subClient: RedisClient) {
    super();
    this.pubClient = pubClient;
    this.subClient = subClient;
    this.subClient.on('message', (channel: string, message: string) => {
      const handler = this.eventHandlers[channel];
      if (handler) handler(...JSON.parse(message));
    });
  }

  override emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean {
    this.pubClient.publish(String(event), JSON.stringify(args), () => void 0);
    return true;
  }

  override on<E extends keyof Events>(event: E, listener: Events[E]): this {
    this.subClient.subscribe(String(event));
    this.eventHandlers[event] = listener;
    return this;
  }
}
