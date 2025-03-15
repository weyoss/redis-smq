/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../common/index.js';
import { EventEmitter } from '../event/index.js';
import { EventBusNotConnectedError } from './errors/index.js';
import { IEventBus, TEventBusEvent } from './types/index.js';

export class EventBus<Events extends TEventBusEvent>
  extends EventEmitter<Events>
  implements IEventBus<Events>
{
  protected connected = false;

  protected constructor() {
    super();
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
    return super.emit(event, ...args);
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
    if (this.connected) this.connected = false;
    cb();
  }

  static createInstance<T extends TEventBusEvent>(
    cb: ICallback<IEventBus<T>>,
  ): void {
    const instance = new EventBus<T>();
    cb(null, instance);
  }
}
