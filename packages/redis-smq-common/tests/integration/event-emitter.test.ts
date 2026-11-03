/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from '../../src/event/index.js';

type TEvent = {
  e1: (arg: string) => void;
};

function makeEmitter() {
  return new EventEmitter<TEvent>();
}

describe('EventEmitter (synchronous)', () => {
  it('on() delivers every event to the listener', () => {
    const emitter = makeEmitter();
    const cb = vi.fn();

    emitter.on('e1', cb);
    emitter.emit('e1', 'hello');

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenNthCalledWith(1, 'hello');
  });

  it('once() fires at most once, for the first event only', () => {
    const emitter = makeEmitter();
    const cb = vi.fn();

    emitter.once('e1', cb);
    emitter.emit('e1', 'hello1');
    emitter.emit('e1', 'hello2');

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenNthCalledWith(1, 'hello1');
  });

  it('removeListener() stops further deliveries', () => {
    const emitter = makeEmitter();
    const cb = vi.fn();

    emitter.on('e1', cb);
    emitter.emit('e1', 'hello1');
    expect(cb).toHaveBeenCalledTimes(1);

    emitter.removeListener('e1', cb);
    emitter.emit('e1', 'hello2');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('removeAllListeners(event) clears only that event', () => {
    const emitter = makeEmitter();
    const cb = vi.fn();

    emitter.on('e1', cb);
    emitter.emit('e1', 'hello1');
    expect(cb).toHaveBeenCalledTimes(1);

    emitter.removeAllListeners('e1');
    emitter.emit('e1', 'hello2');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('removeAllListeners() clears every event', () => {
    const emitter = makeEmitter();
    const cb = vi.fn();

    emitter.on('e1', cb);
    emitter.emit('e1', 'hello1');
    expect(cb).toHaveBeenCalledTimes(1);

    emitter.removeAllListeners();
    emitter.emit('e1', 'hello2');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
