/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TFunction } from '../common/index.js';
import { EventEmitter } from '../event/index.js';
import { TimerError } from './errors/index.js';
import { TTimer, TTimerEvent } from './types/index.js';

export class Timer extends EventEmitter<TTimerEvent> {
  protected timer: TTimer | null = null;

  protected onTick = () => {
    if (!this.timer)
      this.emit('error', new TimerError('Expected a non-empty timer property'));
    else {
      const { fn, periodic } = this.timer;
      if (!periodic) this.timer = null;
      fn();
    }
  };

  setTimeout(fn: TFunction, timeout: number): boolean {
    if (this.timer) {
      return false;
    }
    this.timer = {
      timer: setTimeout(() => this.onTick(), timeout),
      periodic: false,
      fn,
    };
    return true;
  }

  setInterval(fn: TFunction, interval = 1000): boolean {
    if (this.timer) {
      return false;
    }
    this.timer = {
      timer: setInterval(() => this.onTick(), interval),
      periodic: true,
      fn,
    };
    return true;
  }

  reset() {
    if (this.timer) {
      const { timer, periodic } = this.timer;
      if (periodic) clearInterval(timer);
      else clearTimeout(timer);
      this.timer = null;
    }
  }
}
