/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, Runnable, Timer } from 'redis-smq-common';
import { RedisSMQ } from '../../redis-smq.js';
import { IRedisSMQParsedConfig } from '../../config/index.js';

export abstract class WorkerAbstract extends Runnable<Record<string, never>> {
  private timer;
  protected initialized = false;
  protected config;

  constructor(config: IRedisSMQParsedConfig) {
    super();
    this.config = config;
    this.timer = new Timer();
    this.timer.on('error', (err: Error) => this.handleError(err));
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('Worker going up');
    return super.goingUp().concat([
      (cb) => {
        if (RedisSMQ.isInitialized()) return cb();
        RedisSMQ.initialize(this.config.redis, cb);
      },
      (cb) => {
        this.logger.debug('Setting up worker timer');
        this.timer.setTimeout(this.onTick, 1000);
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('Worker going down');
    return [
      (cb: ICallback) => {
        this.logger.debug('Resetting worker timer');
        this.timer.reset();
        cb();
      },
    ].concat(super.goingDown());
  }

  protected onTick = () => {
    if (this.isRunning()) {
      this.logger.debug('Worker tick triggered');
      this.work((err) => {
        if (err) {
          this.logger.error('Error during worker execution', err);
          this.handleError(err);
        } else {
          this.logger.debug('Scheduling next worker tick');
          this.timer.setTimeout(this.onTick, 1000);
        }
      });
    }
  };

  protected override handleError = (err: Error) => {
    if (this.isRunning()) {
      this.logger.error(`Fatal error in worker ${this.constructor.name}`, err);
      // simply crashing the background worker
      throw err;
    }
  };

  abstract work(cb: ICallback<void>): void;
}
