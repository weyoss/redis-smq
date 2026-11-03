/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it } from 'vitest';
import bluebird from 'bluebird';
import { EventBus } from '../../../src/event-bus/index.js';
import {
  assertNotConnectedBehavior,
  exerciseOn,
  exerciseOnce,
  exerciseRemoveAllListeners,
  exerciseRemoveAllListenersForEvent,
  exerciseRemoveListener,
} from './common.js';

type TEvent = {
  e1: (arg: string) => void;
  error: (err: Error) => void;
};

function makeBus() {
  return bluebird.promisifyAll(new EventBus<TEvent>());
}

describe('EventBus (in-memory)', () => {
  it('on() delivers events to the listener', async () => {
    const bus = makeBus();
    await bus.runAsync();
    await exerciseOn(bus);
    await bus.shutdownAsync();
  });

  it('once() fires at most once, for the first event only', async () => {
    const bus = makeBus();
    await bus.runAsync();
    await exerciseOnce(bus);
    await bus.shutdownAsync();
  });

  it('removeListener() stops further deliveries', async () => {
    const bus = makeBus();
    await bus.runAsync();
    await exerciseRemoveListener(bus);
    await bus.shutdownAsync();
  });

  it('removeAllListeners(event) clears only that event', async () => {
    const bus = makeBus();
    await bus.runAsync();
    await exerciseRemoveAllListenersForEvent(bus);
    await bus.shutdownAsync();
  });

  it('removeAllListeners() clears every event', async () => {
    const bus = makeBus();
    await bus.runAsync();
    await exerciseRemoveAllListeners(bus);
    await bus.shutdownAsync();
  });

  it('shuts down idempotently', async () => {
    const bus = makeBus();
    await bus.runAsync();
    await bus.shutdownAsync();
    await bus.shutdownAsync(); // second call is a no-op
  });

  it('emits EventBusNotConnectedError when emitting after shutdown', async () => {
    const bus = makeBus();
    await bus.runAsync();
    await bus.shutdownAsync();
    assertNotConnectedBehavior(bus);
  });
});
