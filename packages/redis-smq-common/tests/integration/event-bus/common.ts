/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, vi } from 'vitest';
import { EventBusNotConnectedError } from '../../../src/event-bus/index.js';

/**
 * Loose shape shared by `EventBus` and `EventBusRedis`.
 *
 * Declared with **method syntax** (not property syntax) on purpose:
 * method declarations are checked bivariantly, which lets us pass either
 * `on(event: 'e1' | 'error', …)` (typed) or `on(event: string, …)` without
 * contravariance errors. If your tsconfig ever disables bivariant method
 * checks, replace every `event: string` below with `event: any`.
 */
export interface TestableEventBus {
  on(event: string, cb: (...args: unknown[]) => void): unknown;
  once(event: string, cb: (...args: unknown[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
  removeListener(event: string, cb: (...args: unknown[]) => void): unknown;
  removeAllListeners(event?: string): unknown;
}

export type Settle = () => Promise<void>;

/** No-op settle for fully synchronous buses. */
export const noopSettle: Settle = async () => undefined;

/** Fixed delay, used for EventBusRedis tests. */
export const settle300ms: Settle = () => new Promise((r) => setTimeout(r, 300));

export async function exerciseOn(
  bus: TestableEventBus,
  settle: Settle = noopSettle,
): Promise<void> {
  const cb = vi.fn();
  bus.on('e1', cb);
  bus.emit('e1', 'hello');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);
  expect(cb).toHaveBeenNthCalledWith(1, 'hello');
}

export async function exerciseOnce(
  bus: TestableEventBus,
  settle: Settle = noopSettle,
): Promise<void> {
  const cb = vi.fn();
  bus.once('e1', cb);
  bus.emit('e1', 'hello1');
  bus.emit('e1', 'hello2');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);
  expect(cb).toHaveBeenNthCalledWith(1, 'hello1');
}

export async function exerciseRemoveListener(
  bus: TestableEventBus,
  settle: Settle = noopSettle,
): Promise<void> {
  const cb = vi.fn();
  bus.on('e1', cb);
  bus.emit('e1', 'hello1');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);
  expect(cb).toHaveBeenNthCalledWith(1, 'hello1');

  bus.removeListener('e1', cb);
  bus.emit('e1', 'hello2');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);
}

export async function exerciseRemoveAllListenersForEvent(
  bus: TestableEventBus,
  settle: Settle = noopSettle,
): Promise<void> {
  const cb = vi.fn();
  bus.on('e1', cb);
  bus.emit('e1', 'hello1');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);

  bus.removeAllListeners('e1');
  bus.emit('e1', 'hello2');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);
}

export async function exerciseRemoveAllListeners(
  bus: TestableEventBus,
  settle: Settle = noopSettle,
): Promise<void> {
  const cb = vi.fn();
  bus.on('e1', cb);
  bus.emit('e1', 'hello1');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);

  bus.removeAllListeners();
  bus.emit('e1', 'hello2');
  await settle();
  expect(cb).toHaveBeenCalledTimes(1);
}

/**
 * Post-shutdown contract shared by both bus implementations:
 *   - Listener registration/removal is a no-op (must NOT emit errors)
 *   - Emitting a non-error event routes to `error` as EventBusNotConnectedError
 */
export function assertNotConnectedBehavior(bus: TestableEventBus): void {
  const errors: Error[] = [];
  bus.on('error', (e) => errors.push(e as Error));

  const noop = () => undefined;
  bus.on('e1', noop);
  bus.once('e1', noop);
  bus.removeListener('e1', noop);
  bus.removeAllListeners('e1');
  bus.removeAllListeners();
  expect(errors).toHaveLength(0);

  // Re-register after removeAllListeners so a listener is active when
  // the emit fails.
  bus.on('error', (e) => errors.push(e as Error));
  bus.emit('e1', 'hello8');

  expect(errors).toHaveLength(1);
  expect(errors[0]).toBeInstanceOf(EventBusNotConnectedError);

  // Cleanup should be a no-op after shutdown.
  bus.removeListener('error', noop);
  bus.removeAllListeners('error');
}
