/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it, vitest } from 'vitest';
import { EventEmitter } from '../../src/event/index.js';

type TEvent = {
  e1: (arg: string) => void;
};

it('EventEmitter', async () => {
  const eventEmitter = new EventEmitter<TEvent>();

  // on
  const callback = vitest.fn();
  eventEmitter.on('e1', callback);
  eventEmitter.emit('e1', 'hello');
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenNthCalledWith(1, 'hello');

  // once
  const callback2 = vitest.fn();
  eventEmitter.once('e1', callback2);
  eventEmitter.emit('e1', 'hello1');
  eventEmitter.emit('e1', 'hello2');
  expect(callback2).toHaveBeenCalledTimes(1);
  expect(callback2).toHaveBeenNthCalledWith(1, 'hello1');

  // removeListener
  const callback3 = vitest.fn();
  eventEmitter.on('e1', callback3);
  eventEmitter.emit('e1', 'hello3');
  expect(callback3).toHaveBeenCalledTimes(1);
  expect(callback3).toHaveBeenNthCalledWith(1, 'hello3');
  eventEmitter.removeListener('e1', callback3);
  eventEmitter.emit('e1', 'hello4');
  expect(callback3).toHaveBeenCalledTimes(1);

  // removeAllListeners of an event
  const callback4 = vitest.fn();
  eventEmitter.on('e1', callback4);
  eventEmitter.emit('e1', 'hello5');
  expect(callback4).toHaveBeenCalledTimes(1);
  expect(callback4).toHaveBeenNthCalledWith(1, 'hello5');
  eventEmitter.removeAllListeners('e1');
  eventEmitter.emit('e1', 'hello6');
  expect(callback4).toHaveBeenCalledTimes(1);

  // removeAllListeners
  const callback5 = vitest.fn();
  eventEmitter.on('e1', callback5);
  eventEmitter.emit('e1', 'hello6');
  expect(callback5).toHaveBeenCalledTimes(1);
  expect(callback5).toHaveBeenNthCalledWith(1, 'hello6');
  eventEmitter.removeAllListeners();
  eventEmitter.emit('e1', 'hello7');
  expect(callback5).toHaveBeenCalledTimes(1);
});
