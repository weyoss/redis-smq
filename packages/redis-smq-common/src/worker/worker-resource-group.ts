/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { readdir } from 'fs';
import path from 'path';
import { async } from '../async/index.js';
import { ICallback } from '../common/index.js';
import { AbortError } from '../errors/index.js';
import { Locker } from '../locker/locker.js';
import { ILogger } from '../logger/index.js';
import { PowerSwitch } from '../power-switch/index.js';
import { IRedisClient } from '../redis-client/index.js';
import { Runnable } from '../runnable/index.js';
import { WorkerRunnable } from './worker-runnable.js';

export type TWorkerResourceGroupEvent = {
  'workerResourceGroup.error': (err: Error) => void;
};

export class WorkerResourceGroup extends Runnable<TWorkerResourceGroupEvent> {
  protected readonly powerManager;
  protected readonly locker;
  protected readonly redisClient;
  protected readonly logger;
  protected workers: WorkerRunnable<unknown>[] = [];
  protected runWorkersLocked = false;

  constructor(
    redisClient: IRedisClient,
    logger: ILogger,
    resourceGroupId: string,
  ) {
    super();
    this.powerManager = new PowerSwitch();
    this.logger = logger;

    //
    this.redisClient = redisClient;
    this.redisClient.once('error', (err) => this.handleError(err));

    // Locker
    this.locker = new Locker(
      redisClient,
      logger,
      resourceGroupId,
      60000,
      true,
      15000,
    );
    this.locker.on('locker.error', (err) => {
      this.handleError(err);
    });
  }

  protected lock = (cb: ICallback<void>) => {
    this.locker.acquireLock((err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Workers are exclusively running from this instance (Lock ID ${this.locker.getId()}).`,
        );
        cb();
      }
    });
  };

  protected runWorkers = (cb: ICallback<void>) => {
    if (!this.runWorkersLocked) {
      this.runWorkersLocked = true;
      async.each(
        this.workers,
        (worker, _, done) => {
          worker.run(done);
        },
        (err) => {
          this.runWorkersLocked = false;
          cb(err);
        },
      );
    } else cb(new AbortError());
  };

  protected shutDownWorkers = (cb: ICallback<void>): void => {
    if (!this.runWorkersLocked) {
      this.runWorkersLocked = true;
      async.each(
        this.workers,
        (worker, _, done) => {
          worker.shutdown(() => done());
        },
        () => {
          this.workers = [];
          this.runWorkersLocked = false;
          cb();
        },
      );
    } else setTimeout(() => this.shutDownWorkers(cb), 1000);
  };

  protected releaseLock = (cb: ICallback<void>) => {
    this.locker.releaseLock(cb);
  };

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([this.lock, this.runWorkers]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [this.shutDownWorkers, this.releaseLock].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.emit('workerResourceGroup.error', err);
      super.handleError(err);
    }
  }

  addWorker = (filename: string, payload: unknown): void => {
    const worker = new WorkerRunnable(filename, payload);
    worker.on('worker.error', (err) => this.handleError(err));
    this.workers.push(worker);
  };

  loadFromDir = (
    workersDir: string,
    payload: unknown,
    cb: ICallback<void>,
  ): void => {
    if (this.isDown() && !this.isGoingUp()) {
      readdir(workersDir, (err, files) => {
        if (err) cb(err);
        else {
          async.each(
            files ?? [],
            (file, _, done) => {
              if (file.endsWith('.worker.js')) {
                const filepath = path.resolve(workersDir, file);
                this.addWorker(filepath, payload);
                done();
              } else done();
            },
            (err) => cb(err),
          );
        }
      });
    }
  };
}
