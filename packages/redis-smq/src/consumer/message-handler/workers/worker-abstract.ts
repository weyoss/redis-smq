/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  createLogger,
  ICallback,
  ILogger,
  Runnable,
  Timer,
} from 'redis-smq-common';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { Configuration } from '../../../config/index.js';
import { IQueueParsedParams } from '../../../queue-manager/index.js';

export abstract class WorkerAbstract extends Runnable<Record<string, never>> {
  protected redisClient;
  protected logger;
  protected config;
  protected queueParsedParams;
  private timer;

  constructor(queueParsedParams: IQueueParsedParams) {
    super();
    this.config = Configuration.getConfig();
    this.queueParsedParams = queueParsedParams;

    // Logger
    this.logger = createLogger(
      this.config.logger,
      this.constructor.name.toLowerCase(),
    );
    this.logger.info(`Initializing worker: ${this.constructor.name}`);

    // RedisClient
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.handleError(err));

    // Timer
    this.timer = new Timer();
    this.timer.on('error', (err: Error) => this.handleError(err));
  }

  abstract work(cb: ICallback<void>): void;

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('Worker going up');
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        this.logger.debug('Initializing Redis client');
        this.redisClient.init(cb);
      },
      (cb: ICallback<void>) => {
        this.logger.debug('Setting up worker timer');
        this.timer.setTimeout(this.onTick, 1000);
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('Worker going down');
    return [
      (cb: ICallback<void>) => {
        this.logger.debug('Resetting worker timer');
        this.timer.reset();
        cb();
      },
      (cb: ICallback<void>) => {
        this.logger.debug('Shutting down Redis client');
        this.redisClient.shutdown(cb);
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
}
