/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, Runnable, Timer } from 'redis-smq-common';
import { RedisSMQ } from '../../../redis-smq/index.js';
import { IRedisSMQParsedConfig } from '../../../config/index.js';

export abstract class WorkerAbstract extends Runnable<Record<string, never>> {
  private timer: Timer | null = null;
  protected initialized = false;
  protected config;

  protected abstract override readonly logger: ILogger;

  constructor(config: IRedisSMQParsedConfig) {
    super();
    this.config = config;
  }

  protected override finalizeUp() {
    this.timer?.schedule(this.onTick, 1000);
    super.finalizeUp();
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      (cb) => {
        if (RedisSMQ.isInitialized()) return cb();
        RedisSMQ.initialize(this.config.redis, cb);
      },
      (cb) => {
        this.logger.debug('Setting up worker timer');
        // TS2715: Abstract property logger in class WorkerAbstract cannot be accessed in the constructor.
        this.timer = new Timer(this.logger);
        this.timer.run(cb);
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback) => {
        this.logger.debug('Resetting worker timer');
        if (this.timer) {
          this.timer.shutdown(cb);
          return;
        }
        cb();
      },
    ].concat(super.goingDown());
  }

  protected onTick = () => {
    if (this.isOperational()) {
      this.work((err) => {
        if (err) {
          this.logger.error('Error during worker execution', err);
          this.handleError(err);
          return;
        }

        this.timer?.schedule(this.onTick, 1000);
      });
    }
  };

  protected override handleError = (err: Error) => {
    if (this.isOperational()) {
      this.logger.error(`Fatal error in worker ${this.constructor.name}`, err);
      // simply crashing the background worker
      throw err;
    }
  };

  abstract work(cb: ICallback<void>): void;
}
