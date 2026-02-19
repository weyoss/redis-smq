/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../async/index.js';
import { AbortError } from '../../errors/index.js';
import { AcquireLockError, RedisLock } from '../../redis-lock/index.js';
import { ILogger } from '../../logger/index.js';
import { IRedisClient } from '../../redis-client/index.js';
import { Runnable } from '../../runnable/index.js';
import { RunnableWorker } from '../runnable-worker.js';
import { WorkerHandler } from './worker-handler.js';
import { WorkerLoader } from './worker-loader.js';

export type TWorkerClusterEvent = {
  'workerCluster.error': (err: Error) => void;
  'workerCluster.workerAdded': (worker: RunnableWorker<unknown>) => void;
  'workerCluster.workerRemoved': (workerId: string) => void;
};

/**
 * Coordinates distributed worker execution across multiple instances
 * using Redis locks for exclusive access
 */
export class WorkerCluster extends Runnable<TWorkerClusterEvent> {
  private readonly workerHandler: WorkerHandler;
  private readonly workerLoader: WorkerLoader;
  private readonly locker: RedisLock;
  private readonly redisClient: IRedisClient;
  private readonly resourceGroupId: string;
  protected readonly logger: ILogger;

  constructor(
    redisClient: IRedisClient,
    logger: ILogger,
    resourceGroupId: string,
    workerFilenamePattern = '.worker.js',
  ) {
    super();

    this.resourceGroupId = resourceGroupId;
    this.logger = logger.createLogger(this.constructor.name);
    this.redisClient = redisClient;

    this.locker = this.createLocker();
    this.workerHandler = new WorkerHandler({ logger: this.logger });
    this.workerLoader = new WorkerLoader(
      this.logger,
      workerFilenamePattern,
      this.handleWorkerError.bind(this),
      this.workerHandler,
    );

    this.setupLockerListeners();
    this.logger.info(`WorkerCluster initialized for ID: ${resourceGroupId}`);
  }

  private createLocker(): RedisLock {
    this.logger.debug(
      `Creating RedisLock for resource group: ${this.resourceGroupId}`,
    );
    return new RedisLock(
      this.redisClient,
      this.logger,
      this.resourceGroupId,
      60000, // lock TTL
      true, // retry on failure
      15000, // retry interval
    );
  }

  private setupLockerListeners(): void {
    this.locker.on('locker.error', (err) => {
      this.logger.error(`Locker error: ${err.message}`, err);
      this.handleError(err);
    });
  }

  private handleWorkerError(err: Error, filename: string): void {
    this.logger.error(`Worker error from ${filename}: ${err.message}`, err);
    this.handleError(err);
  }

  private acquireLock = (cb: ICallback): void => {
    if (!this.isOperational()) {
      cb(new Error('Resource group is shutting down'));
      return;
    }

    this.logger.debug('Attempting to acquire lock...');
    this.locker.acquireLock((err) => {
      if (!err) {
        this.logger.info(
          `Lock acquired successfully (Lock ID: ${this.locker.getId()})`,
        );
        cb();
        return;
      }

      if (err instanceof AcquireLockError) {
        this.logger.warn(
          'Could not acquire lock (already locked by another instance)',
        );
        cb(new AbortError());
      } else {
        this.logger.error(`Failed to acquire lock: ${err.message}`, err);
        cb(err);
      }
    });
  };

  private releaseLock = (cb: ICallback): void => {
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

  protected override goingUp(): ((cb: ICallback) => void)[] {
    this.logger.debug('WorkerCluster going up...');
    return [
      ...super.goingUp(),
      this.acquireLock,
      (cb) => this.workerHandler.run(cb),
    ];
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    this.logger.debug('WorkerCluster going down...');
    return [
      (cb) => this.workerHandler.shutdown(cb),
      this.releaseLock,
      ...super.goingDown(),
    ];
  }

  protected override handleError(err: Error): void {
    if (this.isOperational()) {
      this.logger.error(`WorkerCluster error: ${err.message}`, err);
      this.emit('workerCluster.error', err);
      super.handleError(err);
    }
  }

  /**
   * Adds a worker instance to the cluster
   * @throws {Error} if cluster is not in DOWN state
   */
  addWorker(filename: string, payload: unknown): RunnableWorker<unknown> {
    this.assertDownState('add workers');

    this.logger.debug(`Adding worker from file: ${filename}`);
    const worker = this.workerLoader.createWorker(filename, payload);
    this.emit('workerCluster.workerAdded', worker);

    return worker;
  }

  /**
   * Loads workers from a directory
   * @throws {Error} if cluster is not in DOWN state or workers already exist
   */
  loadFromDir = <WorkerPayload = unknown>(
    workersDir: string,
    payload: WorkerPayload,
    cb: ICallback,
  ): void => {
    const stateError = this.validateDownState('load workers');
    if (stateError) {
      cb(stateError);
      return;
    }

    if (this.workerHandler.hasWorkers()) {
      this.logger.warn(
        'Cannot load workers: Workers already exist in resource group',
      );
      cb(new Error('Workers already exist, cannot load new ones'));
      return;
    }

    this.logger.info(`Loading workers from directory: ${workersDir}`);
    this.workerLoader.loadFromDirectory(workersDir, payload, (err) => {
      if (!err) {
        this.logger.info(`Successfully loaded workers from ${workersDir}`);
      }
      cb(err);
    });
  };

  private assertDownState(operation: string): void {
    const err = this.validateDownState(operation);
    if (err) throw err;
  }

  private validateDownState(operation: string): Error | void {
    if (!this.isDown()) {
      this.logger.warn(
        `Cannot ${operation}: Resource group is not in DOWN state`,
      );
      return new Error(`Resource group must be in DOWN state to ${operation}`);
    }

    if (this.isGoingUp()) {
      this.logger.warn(`Cannot ${operation}: Resource group is going up`);
      return new Error(`Cannot ${operation} while going up`);
    }
  }
}
