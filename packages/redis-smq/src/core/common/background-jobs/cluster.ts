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
  IRedisClient,
  Runnable,
  WorkerCluster,
} from 'redis-smq-common';
import { Configuration } from '../../config-manager/configuration.js';
import { Pool } from '../redis/connection-pool/pool.js';
import { ERedisConnectionAcquisitionMode } from '../redis/connection-pool/types/connection-pool.js';
import path from 'path';
import { isMainThread } from 'node:worker_threads';
import { IWorkerPayload } from '../workers/types/worker.js';
import { Config } from '../redis/config.js';

const curDir = env.getCurrentDir();
const workersPath = path.resolve(curDir, 'jobs');

export class Cluster extends Runnable<never> {
  protected static instance: Cluster | null = null;
  protected logger;
  protected config;
  protected workerCluster: WorkerCluster | null = null;
  protected redisClient: IRedisClient | null = null;

  protected constructor() {
    super();
    this.config = Configuration.getConfig();
    this.logger = createLogger(this.config.logger, [
      `${this.constructor.name}-${this.getId()}`,
    ]);
  }

  static run(cb: ICallback<void>) {
    // avoid to recursively launch new background jobs from background jobs
    if (!isMainThread) {
      return cb();
    }

    if (!Cluster.instance) {
      Cluster.instance = new Cluster();
    }

    Cluster.instance.run(cb);
  }

  static shutdown(cb: ICallback) {
    if (Cluster.instance) {
      Cluster.instance.shutdown(() => {
        Cluster.instance = null;
        cb();
      });
      return;
    }
    cb();
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => {
        const redisConnectionPool = Pool.getInstance();
        redisConnectionPool.acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            this.redisClient = redisClient;
            this.workerCluster = new WorkerCluster(
              redisClient,
              this.logger,
              null,
              '.job.js',
            );
            this.workerCluster.on('workerCluster.error', (err) => {
              this.logger.error(err);
            });
            this.workerCluster.loadFromDir<IWorkerPayload>(
              workersPath,
              {
                config: this.config,
                redisConfig: Config.getConfig(),
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
        if (this.workerCluster) {
          this.workerCluster.removeAllListeners('workerCluster.error');
          this.workerCluster.shutdown(cb);
        } else cb();
      },
      (cb: ICallback) => {
        if (this.redisClient) {
          Pool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }
}
