/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it, vitest } from 'vitest';
import bluebird from 'bluebird';
import {
  EventBusNotConnectedError,
  EventBusRedis,
} from '../../src/event-bus/index.js';
import { redisConfig } from '../config.js';

type TEvent = {
  e1: (arg: string) => void;
  error: (err: Error) => void;
};

it('EventBusRedis: case 1', async () => {
  const eventBusAsync = bluebird.promisifyAll(
    new EventBusRedis<TEvent>({ redis: redisConfig }),
  );
  await eventBusAsync.runAsync();

  // on
  const callback = vitest.fn();
  eventBusAsync.on('e1', callback);
  eventBusAsync.emit('e1', 'hello');
  await bluebird.delay(2000);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenNthCalledWith(1, 'hello');

  // once
  const callback2 = vitest.fn();
  eventBusAsync.once('e1', callback2);
  eventBusAsync.emit('e1', 'hello1');
  eventBusAsync.emit('e1', 'hello2');
  await bluebird.delay(2000);
  expect(callback2).toHaveBeenCalledTimes(1);
  expect(callback2).toHaveBeenNthCalledWith(1, 'hello1');

  // removeListener
  const callback3 = vitest.fn();
  eventBusAsync.on('e1', callback3);
  eventBusAsync.emit('e1', 'hello3');
  await bluebird.delay(2000);
  expect(callback3).toHaveBeenCalledTimes(1);
  expect(callback3).toHaveBeenNthCalledWith(1, 'hello3');
  eventBusAsync.removeListener('e1', callback3);
  eventBusAsync.emit('e1', 'hello4');
  await bluebird.delay(2000);
  expect(callback3).toHaveBeenCalledTimes(1);

  // removeAllListeners of an event
  const callback4 = vitest.fn();
  eventBusAsync.on('e1', callback4);
  eventBusAsync.emit('e1', 'hello5');
  await bluebird.delay(2000);
  expect(callback4).toHaveBeenCalledTimes(1);
  expect(callback4).toHaveBeenNthCalledWith(1, 'hello5');
  eventBusAsync.removeAllListeners('e1');
  eventBusAsync.emit('e1', 'hello6');
  await bluebird.delay(2000);
  expect(callback4).toHaveBeenCalledTimes(1);

  // removeAllListeners (all)
  const callback5 = vitest.fn();
  eventBusAsync.on('e1', callback5);
  eventBusAsync.emit('e1', 'hello6');
  await bluebird.delay(2000);
  expect(callback5).toHaveBeenCalledTimes(1);
  expect(callback5).toHaveBeenNthCalledWith(1, 'hello6');
  eventBusAsync.removeAllListeners();
  await bluebird.delay(4000);
  eventBusAsync.emit('e1', 'hello7');
  expect(callback5).toHaveBeenCalledTimes(1);

  await eventBusAsync.shutdownAsync();
  await eventBusAsync.shutdownAsync(); // second time should be no-op

  // After shutdown:
  // - Listener operations should NOT emit errors.
  // - Emitting non-error events SHOULD emit EventBusNotConnectedError.
  const errors: Error[] = [];
  eventBusAsync.on('error', (e) => errors.push(e));

  // Listener operations: no errors expected
  const noop = () => void 0;
  eventBusAsync.on('e1', noop);
  eventBusAsync.once('e1', noop);
  eventBusAsync.removeListener('e1', noop);
  eventBusAsync.removeAllListeners('e1');
  eventBusAsync.removeAllListeners();
  expect(errors.length).toBe(0);

  // Emitting while not running: should emit EventBusNotConnectedError
  eventBusAsync.on('error', (e) => errors.push(e));
  eventBusAsync.emit('e1', 'hello8');
  expect(errors.length).toBe(1);
  expect(errors[0]).toBeInstanceOf(EventBusNotConnectedError);

  // Cleanup error listeners should be no-op
  eventBusAsync.removeListener('error', noop);
  eventBusAsync.removeAllListeners('error');
});
