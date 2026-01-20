/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
} from 'redis-smq-common';
import { WorkerAbstract } from '../worker/worker-abstract.js';
import { IGlobalWorkerPayload } from '../worker/types/global-worker.js';
import { RedisConnectionPool } from '../redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../redis/redis-connection-pool/types/connection-pool.js';

export abstract class BackgroundJobWorkerAbstract extends WorkerAbstract {
  protected override logger: ILogger;
  protected redisClient: IRedisClient | null = null;

  protected constructor(payload: IGlobalWorkerPayload) {
    super(payload.config);
    this.logger = createLogger(payload.config.logger, [
      ...payload.loggerContext.namespaces,
      this.constructor.name,
    ]);
    this.logger.info(`Worker ${this.constructor.name} initialized.`);
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => {
        RedisConnectionPool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            this.redisClient = redisClient;
            cb();
          },
        );
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback) => {
        if (this.redisClient) {
          RedisConnectionPool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }

  protected getRedisClient(): IRedisClient {
    if (!this.redisClient)
      throw new PanicError({ message: 'A RedisClient instance is required.' });
    return this.redisClient;
  }
}
