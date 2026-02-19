/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RunnableWorker } from '../runnable-worker.js';
import { ILogger } from '../../logger/index.js';
import { ICallback } from '../../async/index.js';
import { Runnable } from '../../runnable/index.js';

/**
 * Handles the lifecycle and collection of workers
 */
export class WorkerHandler extends Runnable {
  private readonly workers: Map<string, RunnableWorker<unknown>> = new Map();
  protected readonly logger: ILogger;

  constructor({ logger }: { logger: ILogger }) {
    super();
    this.logger = logger.createLogger(this.constructor.name);
  }

  protected override finalizeUp() {
    super.finalizeUp();
    this.logger.debug(`All ${this.workers.size} workers started successfully`);
  }

  protected override goingUp(): Array<(cb: ICallback) => void> {
    const workers = this.getAllWorkers();
    if (workers.length === 0) {
      this.logger.warn('No workers to run');
      return super.goingUp();
    }
    const tasks = workers.map((worker, index) => {
      return (done: ICallback) => {
        this.logger.debug(
          `Starting worker ${index + 1}/${workers.length} (ID: ${worker.getId()})`,
        );
        worker.run((err) => {
          if (err) {
            this.logger.error(
              `Failed to start worker ${worker.getId()}: ${err.message}`,
              err,
            );
          } else {
            this.logger.debug(`Worker ${worker.getId()} started successfully`);
          }
          done(err);
        });
      };
    });
    return super.goingUp().concat(tasks);
  }

  protected override finalizeDown() {
    super.finalizeDown();
    this.logger.debug(`All workers stopped`);
  }

  protected override goingDown(): Array<(cb: ICallback) => void> {
    const workers = this.getAllWorkers();
    if (workers.length === 0) {
      this.logger.debug('No workers to stop');
      return super.goingDown();
    }

    this.logger.info(`Stopping ${workers.length} workers...`);
    const tasks = workers.map((worker, index) => {
      return (done: ICallback) => {
        this.logger.debug(
          `Shutting down worker ${index + 1}/${workers.length} (ID: ${worker.getId()})`,
        );
        worker.shutdown((err) => {
          if (err) {
            this.logger.warn(
              `Worker shutdown failed for ${worker.getId()}: ${err.message}`,
            );
          }
          done();
        });
      };
    });
    return tasks.concat(super.goingDown());
  }

  addWorker(worker: RunnableWorker<unknown>): void {
    if (this.isOperational())
      throw new Error('Instance must be shut down before managing workers');

    this.workers.set(worker.getId(), worker);
    this.logger.debug(
      `Worker added: ${worker.getWorkerFilename()}, total: ${this.workers.size}`,
    );
  }

  removeWorker(workerId: string): boolean {
    if (this.isOperational())
      throw new Error('Instance must be shut down before managing workers');

    const removed = this.workers.delete(workerId);
    if (removed) {
      this.logger.debug(
        `Worker removed: ${workerId}, remaining: ${this.workers.size}`,
      );
    }
    return removed;
  }

  getWorker(workerId: string): RunnableWorker<unknown> | undefined {
    return this.workers.get(workerId);
  }

  getAllWorkers(): RunnableWorker<unknown>[] {
    return Array.from(this.workers.values());
  }

  hasWorkers(): boolean {
    return this.workers.size > 0;
  }

  count(): number {
    return this.workers.size;
  }

  clear(): void {
    if (this.isOperational())
      throw new Error('Instance must be shut down before managing workers');

    this.workers.clear();
    this.logger.debug('All workers cleared');
  }
}
