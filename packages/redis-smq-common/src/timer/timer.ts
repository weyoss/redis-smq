/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { clearTimeout } from 'node:timers';
import { ICallback } from '../async/index.js';
import { ILogger } from '../logger/index.js';
import { Runnable } from '../runnable/index.js';

export class Timer extends Runnable {
  private timer: NodeJS.Timeout | null = null;

  protected override readonly logger: ILogger;

  constructor(logger: ILogger) {
    super();
    this.logger = logger.createLogger(this.constructor.name);
  }

  protected override goingUp(): Array<(cb: ICallback) => void> {
    return super.goingUp().concat([
      (cb: ICallback) => {
        this.reset();
        cb();
      },
    ]);
  }

  protected override goingDown(): Array<(cb: ICallback) => void> {
    return [
      (cb: ICallback) => {
        this.reset();
        cb();
      },
    ].concat(super.goingDown());
  }

  schedule = (fn: () => void, delayMs: number): boolean => {
    if (!this.isRunning()) {
      this.logger.debug(
        'Instance not operational - Skipping next tick scheduling',
      );
      return false;
    }

    if (this.timer) {
      this.logger.debug(
        'Could not schedule the requested operation: timer is busy',
      );
      return false;
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.isRunning()) fn();
    }, delayMs);

    return true;
  };

  reset(): void {
    if (this.timer) {
      this.logger.debug('Resetting nextTick schedule...');
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
