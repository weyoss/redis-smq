/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, logger, Runnable, Timer } from 'redis-smq-common';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { Configuration } from '../../../config/index.js';
import { IConsumerMessageHandlerWorkerPayload } from '../types/index.js';

export abstract class Worker extends Runnable<Record<string, never>> {
  protected redisClient;
  protected logger;
  private timer;
  protected config;
  protected queueParsedParams;

  constructor({
    config,
    queueParsedParams,
  }: IConsumerMessageHandlerWorkerPayload) {
    super();
    this.config = config;
    Configuration.getSetConfig(config);
    this.queueParsedParams = queueParsedParams;
    this.logger = logger.getLogger(
      config.logger,
      `worker:${this.constructor.name.toLowerCase()}:${this.id}`,
    );
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.handleError(err));
    this.timer = new Timer();
    this.timer.on('error', (err: Error) => this.handleError(err));
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  abstract work(cb: ICallback<void>): void;

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      this.redisClient.init,
      (cb: ICallback<void>) => {
        this.timer.setTimeout(this.onTick, 1000);
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback<void>) => {
        this.timer.reset();
        cb();
      },
      this.redisClient.shutdown,
    ].concat(super.goingDown());
  }

  protected onTick = () => {
    if (this.isRunning()) {
      this.work((err) => {
        if (err) this.handleError(err);
        else this.timer.setTimeout(this.onTick, 1000);
      });
    }
  };

  protected override handleError = (err: Error) => {
    if (this.isRunning()) {
      // simply crashing the background worker
      throw err;
    }
  };
}
