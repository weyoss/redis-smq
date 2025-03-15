/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TEventEmitterEvent = Record<string, (...args: any[]) => void>; // type-coverage:ignore-line

export interface IEventEmitter<Events extends TEventEmitterEvent> {
  on<E extends keyof Events>(event: E, listener: Events[E]): this;

  once<E extends keyof Events>(event: E, listener: Events[E]): this;

  emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean;

  removeAllListeners<E extends keyof Events>(event?: E): this;

  removeListener<E extends keyof Events>(event: E, listener: Events[E]): this;
}
