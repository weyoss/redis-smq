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
import { ICallback } from '../async/index.js';
import { AbortError } from '../errors/index.js';
import { RedisLock } from '../redis-lock/index.js';
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

    this.logger.info(
      `Initializing WorkerResourceGroup with ID: ${resourceGroupId}`,
    );

    //
    this.redisClient = redisClient;
    this.redisClient.once('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`, err);
      this.handleError(err);
    });

    // Locker
    this.logger.debug(
      `Creating RedisLock for resource group: ${resourceGroupId}`,
    );
    this.locker = new RedisLock(
      redisClient,
      logger,
      resourceGroupId,
      60000,
      true,
      15000,
    );
    this.locker.on('locker.error', (err) => {
      this.logger.error(`Locker error: ${err.message}`, err);
      this.handleError(err);
    });

    this.logger.info(
      `WorkerResourceGroup initialized with ID: ${resourceGroupId}`,
    );
  }

  protected lock = (cb: ICallback<void>) => {
    this.logger.debug('Attempting to acquire lock...');
    this.locker.acquireLock((err, acquired) => {
      if (err) {
        this.logger.error(`Failed to acquire lock: ${err.message}`, err);
        cb(err);
      } else if (acquired) {
        this.logger.info(
          `Workers are exclusively running from this instance (Lock ID ${this.locker.getId()}).`,
        );
        cb();
      } else {
        this.logger.warn('Lock was not acquired, but no error was returned');
        cb();
      }
    });
  };

  protected runWorkers = (cb: ICallback<void>) => {
    if (!this.runWorkersLocked) {
      this.logger.info(`Starting ${this.workers.length} workers...`);
      this.runWorkersLocked = true;
      async.eachOf(
        this.workers,
        (worker, index, done) => {
          this.logger.debug(
            `Starting worker ${index + 1}/${this.workers.length} (ID: ${worker.getId()})`,
          );
          worker.run((err) => {
            if (err) {
              this.logger.error(
                `Failed to start worker ${index + 1}/${this.workers.length} (ID: ${worker.getId()}): ${err.message}`,
                err,
              );
            } else {
              this.logger.debug(
                `Worker ${index + 1}/${this.workers.length} (ID: ${worker.getId()}) started successfully`,
              );
            }
            done(err);
          });
        },
        (err) => {
          this.runWorkersLocked = false;
          if (err) {
            this.logger.error(`Error starting workers: ${err.message}`, err);
          } else {
            this.logger.info(
              `All ${this.workers.length} workers started successfully`,
            );
          }
          cb(err);
        },
      );
    } else {
      this.logger.warn('Attempted to run workers while already locked');
      cb(new AbortError());
    }
  };

  protected shutDownWorkers = (cb: ICallback<void>): void => {
    if (!this.runWorkersLocked) {
      this.logger.info(`Shutting down ${this.workers.length} workers...`);
      this.runWorkersLocked = true;
      async.eachOf(
        this.workers,
        (worker, index, done) => {
          this.logger.debug(
            `Shutting down worker ${index + 1}/${this.workers.length} (ID: ${worker.getId()})`,
          );
          worker.shutdown((err) => {
            if (err) {
              this.logger.warn(
                `Error shutting down worker ${index + 1}/${this.workers.length} (ID: ${worker.getId()}): ${err.message}`,
              );
            } else {
              this.logger.debug(
                `Worker ${index + 1}/${this.workers.length} (ID: ${worker.getId()}) shut down successfully`,
              );
            }
            done(); // Always continue shutdown process regardless of errors
          });
        },
        () => {
          this.workers = [];
          this.runWorkersLocked = false;
          this.logger.info('All workers have been shut down');
          cb();
        },
      );
    } else {
      this.logger.debug(
        'Workers shutdown requested but workers are locked, retrying in 1 second...',
      );
      setTimeout(() => this.shutDownWorkers(cb), 1000);
    }
  };

  protected releaseLock = (cb: ICallback<void>) => {
    this.logger.debug('Releasing lock...');
    this.locker.releaseLock((err) => {
      if (err) {
        this.logger.error(`Failed to release lock: ${err.message}`, err);
      } else {
        this.logger.info('Lock released successfully');
      }
      cb(err);
    });
  };

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('WorkerResourceGroup going up...');
    return super.goingUp().concat([this.lock, this.runWorkers]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.debug('WorkerResourceGroup going down...');
    return [this.shutDownWorkers, this.releaseLock].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.logger.error(`WorkerResourceGroup error: ${err.message}`, err);
      this.emit('workerResourceGroup.error', err);
      super.handleError(err);
    }
  }

  addWorker = (filename: string, payload: unknown): void => {
    this.logger.debug(`Adding worker from file: ${filename}`);
    const worker = new WorkerRunnable(filename, payload, this.logger);
    worker.on('worker.error', (err) => {
      this.logger.error(`Worker error from ${filename}: ${err.message}`, err);
      this.handleError(err);
    });
    this.workers.push(worker);
    this.logger.info(
      `Worker added from file: ${filename}, total workers: ${this.workers.length}`,
    );
  };

  loadFromDir = (
    workersDir: string,
    payload: unknown,
    cb: ICallback<void>,
  ): void => {
    if (this.isDown() && !this.isGoingUp()) {
      this.logger.info(`Loading workers from directory: ${workersDir}`);
      readdir(workersDir, (err, files) => {
        if (err) {
          this.logger.error(
            `Failed to read workers directory ${workersDir}: ${err.message}`,
            err,
          );
          cb(err);
        } else {
          this.logger.debug(`Found ${files.length} files in workers directory`);
          let workerCount = 0;

          async.eachOf(
            files ?? [],
            (file, index, done) => {
              if (file.endsWith('.worker.js')) {
                const filepath = path.resolve(workersDir, file);
                this.logger.debug(
                  `Loading worker file ${index + 1}/${files.length}: ${file}`,
                );
                this.addWorker(filepath, payload);
                workerCount++;
                done();
              } else {
                this.logger.debug(`Skipping non-worker file: ${file}`);
                done();
              }
            },
            (err) => {
              if (err) {
                this.logger.error(`Error loading workers: ${err.message}`, err);
              } else {
                this.logger.info(
                  `Successfully loaded ${workerCount} workers from ${files.length} files`,
                );
              }
              cb(err);
            },
          );
        }
      });
    } else {
      this.logger.warn(
        'Cannot load workers: WorkerResourceGroup is not in DOWN state',
      );
      cb(
        new Error(
          'Cannot load workers: WorkerResourceGroup is not in DOWN state',
        ),
      );
    }
  };
}
