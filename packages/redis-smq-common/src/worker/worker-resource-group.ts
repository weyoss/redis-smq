/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
  'workerResourceGroup.workerAdded': (worker: WorkerRunnable<unknown>) => void;
};

export class WorkerResourceGroup extends Runnable<TWorkerResourceGroupEvent> {
  protected readonly powerManager;
  protected readonly locker;
  protected readonly redisClient;
  protected readonly logger;
  protected readonly resourceGroupId: string;
  protected workers: WorkerRunnable<unknown>[] = [];
  private runWorkersLocked = false;

  constructor(
    redisClient: IRedisClient,
    logger: ILogger,
    resourceGroupId: string,
  ) {
    super();

    this.resourceGroupId = resourceGroupId;
    this.powerManager = new PowerSwitch();
    this.logger = logger.createLogger(this.constructor.name);

    this.redisClient = redisClient;

    this.logger.debug(
      `Creating RedisLock for resource group: ${resourceGroupId}`,
    );
    this.locker = new RedisLock(
      redisClient,
      this.logger,
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
      `WorkerResourceGroup initialized for ID: ${resourceGroupId}`,
    );
  }

  /**
   * Clean up a batch of workers
   */
  private cleanupWorkerBatch(
    workers: WorkerRunnable<unknown>[],
    cb: ICallback<void>,
  ): void {
    if (workers.length === 0) {
      cb();
      return;
    }

    this.logger.debug(`Cleaning up batch of ${workers.length} workers...`);

    async.each(
      workers,
      (worker, _, done) => {
        worker.shutdown((err) => {
          if (err) {
            this.logger.warn(
              `Worker cleanup failed for ${worker.getId()}: ${err.message}`,
            );
          }
          done();
        });
      },
      (err) => {
        if (err) {
          this.logger.warn(`Some workers had cleanup errors: ${err.message}`);
        }
        this.logger.debug(
          `Batch cleanup completed for ${workers.length} workers`,
        );
        cb();
      },
    );
  }

  protected lock = (cb: ICallback<void>): void => {
    if (!this.isRunning()) {
      cb(new Error('Resource group is shutting down'));
      return;
    }

    this.logger.debug('Attempting to acquire lock...');
    this.locker.acquireLock((err, acquired) => {
      if (err) {
        this.logger.error(`Failed to acquire lock: ${err.message}`, err);
        cb(err);
      } else if (acquired) {
        this.logger.info(
          `Lock acquired successfully (Lock ID: ${this.locker.getId()})`,
        );
        cb();
      } else {
        this.logger.warn(
          'Could not acquire lock (already locked by another instance)',
        );
        cb(new AbortError());
      }
    });
  };

  protected runWorkers = (cb: ICallback<void>): void => {
    if (!this.isRunning()) {
      return cb(new Error('Resource group is shutting down'));
    }

    if (this.runWorkersLocked) {
      this.logger.warn('Workers are already running');
      return cb(new AbortError());
    }

    if (this.workers.length === 0) {
      this.logger.warn('No workers to run');
      return cb();
    }

    this.runWorkersLocked = true;
    this.logger.info(`Starting ${this.workers.length} workers...`);

    async.eachOf(
      this.workers,
      (worker, index, done) => {
        this.logger.debug(
          `Starting worker ${index + 1}/${this.workers.length} (ID: ${worker.getId()})`,
        );

        worker.run((err) => {
          if (err) {
            this.logger.error(
              `Failed to start worker ${index + 1}/${this.workers.length}: ${err.message}`,
              err,
            );
          } else {
            this.logger.debug(
              `Worker ${index + 1}/${this.workers.length} started successfully`,
            );
          }
          done(err);
        });
      },
      (err) => {
        this.runWorkersLocked = false;

        if (err) {
          this.logger.error(`Error starting workers: ${err.message}`, err);
          // Stop any workers that did start
          this.stopAllWorkers();
        } else {
          this.logger.info(
            `All ${this.workers.length} workers started successfully`,
          );
        }
        cb(err);
      },
    );
  };

  /**
   * Stop all workers immediately
   */
  private stopAllWorkers(): void {
    if (this.workers.length === 0) return;

    this.logger.info(`Stopping ${this.workers.length} workers...`);

    this.workers.forEach((worker, index) => {
      this.logger.debug(`Stopping worker ${index + 1}/${this.workers.length}`);
      worker.shutdown((err) => {
        if (err) {
          this.logger.warn(`Error stopping worker: ${err.message}`);
        }
      });
    });
  }

  protected shutDownWorkers = (cb: ICallback<void>): void => {
    if (this.workers.length === 0) {
      this.logger.debug('No workers to shut down');
      cb();
      return;
    }

    this.logger.info(`Shutting down ${this.workers.length} workers...`);

    const workersToShutdown = [...this.workers];

    let completed = 0;
    let hasError = false;

    const onWorkerShutdown = (err?: Error): void => {
      completed++;

      if (err && !hasError) {
        hasError = true;
        this.logger.warn(`Worker shutdown error: ${err.message}`);
      }

      if (completed === workersToShutdown.length) {
        this.workers = []; // Clear only after all shutdowns complete
        if (hasError) {
          this.logger.warn('Some workers had errors during shutdown');
        } else {
          this.logger.info('All workers shut down successfully');
        }
        cb();
      }
    };

    workersToShutdown.forEach((worker, index) => {
      this.logger.debug(
        `Shutting down worker ${index + 1}/${workersToShutdown.length}`,
      );

      worker.shutdown((err) => {
        onWorkerShutdown(err || undefined);
      });
    });
  };

  protected releaseLock = (cb: ICallback<void>): void => {
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

  protected addWorkerInstance = (worker: WorkerRunnable<never>): void => {
    const filename = worker.getWorkerFilename();
    worker.removeAllListeners('worker.error');
    worker.on('worker.error', (err) => {
      this.logger.error(`Worker error from ${filename}: ${err.message}`, err);
      this.handleError(err);
    });

    this.workers.push(worker);
    this.emit('workerResourceGroup.workerAdded', worker);

    this.logger.info(
      `Worker added: ${filename}, total workers: ${this.workers.length}`,
    );
  };

  protected validateStateChange(): Error | void {
    if (!this.isDown()) {
      this.logger.warn(
        'Cannot load workers: Resource group is not in DOWN state',
      );
      return new Error('Resource group must be in DOWN state to load workers');
    }

    if (this.isGoingUp()) {
      this.logger.warn('Cannot load workers: Resource group is going up');
      return new Error('Cannot load workers while going up');
    }
  }

  addWorker = (filename: string, payload: unknown): WorkerRunnable<unknown> => {
    const err = this.validateStateChange();
    if (err) throw err;

    this.logger.debug(`Adding worker from file: ${filename}`);

    const worker = new WorkerRunnable(filename, payload, this.logger);
    this.addWorkerInstance(worker);

    return worker;
  };

  loadFromDir = <WorkerPayload = unknown>(
    workersDir: string,
    payload: WorkerPayload,
    cb: ICallback<void>,
  ): void => {
    const err = this.validateStateChange();
    if (err) return cb(err);

    if (this.workers.length > 0) {
      this.logger.warn(
        'Cannot load workers: Workers already exist in resource group',
      );
      cb(new Error('Workers already exist, cannot load new ones'));
      return;
    }

    this.logger.info(`Loading workers from directory: ${workersDir}`);

    readdir(workersDir, (err, files) => {
      if (err) {
        this.logger.error(
          `Failed to read directory ${workersDir}: ${err.message}`,
          err,
        );
        cb(err);
        return;
      }

      const workerFiles = files.filter((file) => file.endsWith('.worker.js'));

      if (workerFiles.length === 0) {
        this.logger.warn(`No .worker.js files found in ${workersDir}`);
        cb();
        return;
      }

      this.logger.debug(`Found ${workerFiles.length} worker files`);

      // Temporary array for this batch
      const tempWorkers: WorkerRunnable<unknown>[] = [];

      async.eachOf(
        workerFiles,
        (file, index, done) => {
          const filepath = path.resolve(workersDir, file);
          this.logger.debug(
            `Creating worker ${index + 1}/${workerFiles.length}: ${file}`,
          );

          try {
            const worker = new WorkerRunnable(filepath, payload, this.logger);

            // Set up temporary error handling
            worker.on('worker.error', (err) => {
              this.logger.debug(
                `Temporary worker error from ${file}: ${err.message}`,
              );
            });

            tempWorkers.push(worker);
            done();
          } catch (error) {
            const err =
              error instanceof Error
                ? error
                : new Error('Failed to create worker');
            this.logger.error(
              `Failed to create worker from ${file}: ${err.message}`,
              err,
            );
            done(err);
          }
        },
        (err) => {
          if (err) {
            this.logger.error(`Error creating workers: ${err.message}`, err);

            // Rollback: Clean up all temporary workers
            return this.cleanupWorkerBatch(tempWorkers, () => {
              this.logger.info(
                'Rollback complete: All temporary workers cleaned up',
              );
              cb(err);
            });
          }

          // Success! All workers created without errors
          this.logger.info(
            `Successfully created ${tempWorkers.length} workers, adding to resource group...`,
          );

          // Replace temporary error handlers with permanent ones
          tempWorkers.forEach((worker) => this.addWorkerInstance(worker));

          this.logger.info(
            `Successfully loaded ${tempWorkers.length} workers from ${workersDir}`,
          );
          cb();
        },
      );
    });
  };
}
