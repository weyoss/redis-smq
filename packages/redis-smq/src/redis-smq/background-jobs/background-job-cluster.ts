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
  env,
  ICallback,
  Runnable,
  WorkerCluster,
} from 'redis-smq-common';
import { Configuration } from '../../config/index.js';
import { RedisConnectionPool } from '../../common/redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../../common/redis/redis-connection-pool/types/connection-pool.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IGlobalWorkerPayload } from '../../common/worker/types/global-worker.js';
import path from 'path';

const curDir = env.getCurrentDir();
const workersPath = path.resolve(curDir, 'jobs');

export class BackgroundJobCluster extends Runnable<never> {
  protected static instance: BackgroundJobCluster | null = null;
  protected logger;
  protected config;
  protected workerCluster: WorkerCluster | null = null;

  protected constructor() {
    super();
    this.config = Configuration.getConfig();
    this.logger = createLogger(this.config.logger, [
      `${this.constructor.name}-${this.getId()}`,
    ]);
  }

  static run(cb: ICallback<void>) {
    if (!BackgroundJobCluster.instance) {
      BackgroundJobCluster.instance = new BackgroundJobCluster();
    }
    BackgroundJobCluster.instance.run(cb);
  }

  static shutdown(cb: ICallback) {
    if (BackgroundJobCluster.instance) {
      BackgroundJobCluster.instance.shutdown(() => {
        BackgroundJobCluster.instance = null;
        cb();
      });
      return;
    }
    cb();
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => {
        RedisConnectionPool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            const { keyGlobalWorkerClusterLock } = redisKeys.getMainKeys();
            this.workerCluster = new WorkerCluster(
              redisClient,
              this.logger,
              keyGlobalWorkerClusterLock,
              '.job.js',
            );
            this.workerCluster.on('workerCluster.error', (err) => {
              this.logger.error(err);
            });
            this.workerCluster.loadFromDir<IGlobalWorkerPayload>(
              workersPath,
              {
                config: this.config,
                loggerContext: { namespaces: this.logger.getNamespaces() },
              },
              (err) => {
                if (err) return cb(err);
                this.workerCluster?.run(() => void 0);
                cb();
              },
            );
          },
        );
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback) => {
        if (this.workerCluster) this.workerCluster.shutdown(cb);
        else cb();
      },
    ].concat(super.goingDown());
  }
}
