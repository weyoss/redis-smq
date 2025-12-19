/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventEmitter as NodeEventEmitter } from 'events';
import { IEventEmitter, TEventEmitterEvent } from './types/index.js';

// A typed EventEmitter around Node's EventEmitter with a limited set of methods
export class EventEmitter<Events extends TEventEmitterEvent>
  implements IEventEmitter<Events>
{
  protected eventEmitter;

  constructor() {
    this.eventEmitter = new NodeEventEmitter();
  }

  on<E extends keyof Events>(event: E, listener: Events[E]): this {
    this.eventEmitter.on(String(event), listener);
    return this;
  }

  once<E extends keyof Events>(event: E, listener: Events[E]): this {
    this.eventEmitter.once(String(event), listener);
    return this;
  }

  emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean {
    return this.eventEmitter.emit(String(event), ...args);
  }

  removeAllListeners<E extends keyof Events>(event?: Extract<E, string>): this {
    if (event) this.eventEmitter.removeAllListeners(event);
    else this.eventEmitter.removeAllListeners();
    return this;
  }

  removeListener<E extends keyof Events>(event: E, listener: Events[E]): this {
    this.eventEmitter.removeListener(String(event), listener);
    return this;
  }
}
