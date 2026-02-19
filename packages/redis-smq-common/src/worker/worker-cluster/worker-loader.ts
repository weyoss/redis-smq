/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { WorkerHandler } from './worker-handler.js';
import { ILogger } from '../../logger/index.js';
import { RunnableWorker } from '../runnable-worker.js';
import { async, ICallback } from '../../async/index.js';
import { findFilesByPattern } from '../../env/filesystem.js';

/**
 * Performs worker creation and loading from filesystem
 */
export class WorkerLoader {
  private readonly logger: ILogger;
  private readonly filenamePattern: string;
  private readonly onWorkerError: (err: Error, filename: string) => void;
  private readonly workerManager: WorkerHandler;

  constructor(
    logger: ILogger,
    filenamePattern: string,
    onWorkerError: (err: Error, filename: string) => void,
    workerManager: WorkerHandler,
  ) {
    this.logger = logger.createLogger(this.constructor.name);
    this.filenamePattern = filenamePattern;
    this.onWorkerError = onWorkerError;
    this.workerManager = workerManager;
  }

  createWorker<TPayload>(
    filename: string,
    payload: TPayload,
  ): RunnableWorker<TPayload> {
    const worker = new RunnableWorker(filename, payload, this.logger);

    worker.removeAllListeners('worker.error');
    worker.on('worker.error', (err) => {
      this.onWorkerError(err, filename);
    });

    this.workerManager.addWorker(worker);
    return worker;
  }

  loadFromDirectory<TPayload>(
    directory: string,
    payload: TPayload,
    cb: ICallback,
  ): void {
    findFilesByPattern(directory, this.filenamePattern, (err, files) => {
      if (err) {
        this.logger.error(
          `Failed to read directory ${directory}: ${err.message}`,
          err,
        );
        cb(err);
        return;
      }

      const workerFiles = files ?? [];
      if (workerFiles.length === 0) {
        this.logger.warn(
          `No ${this.filenamePattern} files found in ${directory}`,
        );
        cb();
        return;
      }

      this.logger.debug(`Found ${workerFiles.length} worker files`);
      this.createWorkersBatch(workerFiles, payload, cb);
    });
  }

  private createWorkersBatch<TPayload>(
    filepaths: string[],
    payload: TPayload,
    cb: ICallback,
  ): void {
    const tempWorkers: RunnableWorker<unknown>[] = [];

    async.eachOf(
      filepaths,
      (filepath, index, done) => {
        this.logger.debug(
          `Creating worker ${index + 1}/${filepaths.length}: ${filepath}`,
        );

        try {
          const worker = new RunnableWorker(filepath, payload, this.logger);

          // Temporary error handling during creation
          worker.on('worker.error', (err) => {
            this.logger.debug(
              `Temporary worker error from ${filepath}: ${err.message}`,
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
            `Failed to create worker from ${filepath}: ${err.message}`,
            err,
          );
          done(err);
        }
      },
      (err) => {
        if (err) {
          this.logger.error(`Error creating workers: ${err.message}`, err);
          this.cleanupTempWorkers(tempWorkers, () => cb(err));
          return;
        }

        // Success - add all workers permanently
        tempWorkers.forEach((worker) => {
          worker.removeAllListeners('worker.error');
          worker.on('worker.error', (err) => {
            this.onWorkerError(err, worker.getWorkerFilename());
          });
          this.workerManager.addWorker(worker);
        });

        this.logger.info(`Successfully created ${tempWorkers.length} workers`);
        cb();
      },
    );
  }

  private cleanupTempWorkers(
    workers: RunnableWorker<unknown>[],
    cb: ICallback,
  ): void {
    if (workers.length === 0) {
      cb();
      return;
    }

    this.logger.debug(`Cleaning up ${workers.length} temporary workers...`);

    async.each(
      workers,
      (worker, _, done) => {
        worker.shutdown((err) => {
          if (err) {
            this.logger.warn(`Temp worker cleanup failed: ${err.message}`);
          }
          done();
        });
      },
      () => {
        this.logger.debug('Temporary workers cleaned up');
        cb();
      },
    );
  }
}
