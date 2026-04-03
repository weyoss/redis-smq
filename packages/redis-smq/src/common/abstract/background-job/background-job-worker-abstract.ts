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
  Heartbeat,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
} from 'redis-smq-common';
import { WorkerAbstract } from '../worker/worker-abstract.js';
import { RedisConnectionPool } from '../../redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../../redis/redis-connection-pool/types/connection-pool.js';
import { redisKeys } from '../../redis/redis-keys/redis-keys.js';
import { HeartbeatFactory } from '../../heartbeat/heartbeat.js';
import { IHeartbeatPayload } from '../../heartbeat/types/index.js';
import { IWorkerPayload } from '../worker/types/worker.js';

export abstract class BackgroundJobWorkerAbstract extends WorkerAbstract {
  protected override logger: ILogger;
  protected redisClient: IRedisClient | null = null;
  protected heartbeat: Heartbeat<IHeartbeatPayload> | null = null;

  protected constructor(payload: IWorkerPayload) {
    super(payload);
    this.logger = createLogger(payload.config.logger, [
      ...payload.loggerContext.namespaces,
      this.constructor.name,
    ]);
    this.logger.debug(`Worker ${this.constructor.name} initialized.`);
  }

  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    if (!this.redisClient)
      return cb(
        new PanicError({
          message: 'Redis client is not initialized',
        }),
      );

    try {
      const { keyWorkerHeartbeat } = redisKeys.getWorkerKeys(this.id);
      this.heartbeat = HeartbeatFactory(this.redisClient, this.logger, {
        heartbeatKey: keyWorkerHeartbeat,
        componentId: this.id,
        componentType: this.constructor.name,
      });
      this.heartbeat.run(cb);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      cb(err);
    }
  };

  protected shutdownHeartbeat = (cb: ICallback): void => {
    if (this.heartbeat) {
      return this.heartbeat.shutdown((err) => {
        this.heartbeat = null;
        cb(err);
      });
    }
    cb();
  };

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
      this.setUpHeartbeat,
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      this.shutdownHeartbeat,
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
