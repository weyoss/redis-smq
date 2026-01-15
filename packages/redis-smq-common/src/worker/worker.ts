/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { randomUUID } from 'node:crypto';
import { resolve } from 'path';
import { Worker as WorkerThread, WorkerOptions } from 'worker_threads';
import { async, ICallback } from '../async/index.js';
import { env } from '../env/index.js';
import { EventEmitter } from '../event/index.js';
import { ILogger } from '../logger/index.js';
import {
  WorkerIsShuttingDownError,
  WorkerThreadError,
  WorkerThreadFailureError,
} from './errors/index.js';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerType,
  TWorkerThreadChildMessage,
  TWorkerThreadParentMessage,
} from './types/index.js';
import { WorkerLogger } from './worker-logger.js';

export type TWorkerEvent = {
  'worker.error': (err: Error) => void;
  'worker.data': (payload: unknown) => void;
  'worker.terminated': () => void;
};

const dir = env.getCurrentDir();

// Track all workers for cleanup
const allWorkers: Worker<never>[] = [];

// Cleanup all workers on process termination
const cleanupAllWorkers = (): void => {
  if (allWorkers.length === 0) return;
  const tasks = allWorkers.map((worker) => {
    return (cb: ICallback) => {
      worker.shutdown(() => cb());
    };
  });
  async.parallel(tasks, () => () => void 0);
};

// Setup signal handlers
process.once('SIGTERM', cleanupAllWorkers);
process.once('SIGINT', cleanupAllWorkers);
process.once('exit', cleanupAllWorkers);

/**
 * Worker base class with custom stream handling
 */
export abstract class Worker<Reply> extends EventEmitter<TWorkerEvent> {
  protected abstract readonly type: EWorkerType;
  protected readonly id;
  protected readonly workerFilename;
  protected readonly initialPayload;
  protected workerThread: WorkerThread | null = null;
  private stdoutStream: WorkerLogger | null = null;
  private stderrStream: WorkerLogger | null = null;
  protected logger: ILogger;
  private isShuttingDown = false;

  protected constructor(
    workerFilename: string,
    initialPayload: unknown,
    logger: ILogger,
  ) {
    super();
    this.id = randomUUID();
    this.workerFilename = workerFilename;
    this.initialPayload = initialPayload;
    this.logger = logger.createLogger(this.constructor.name);

    allWorkers.push(this);
  }

  /**
   * Clean up custom streams
   */
  private cleanupStreams(): void {
    if (this.stdoutStream) {
      try {
        this.stdoutStream.end();
        this.stdoutStream.destroy();
        this.stdoutStream = null;
      } catch (error) {
        this.logger.debug(`Error cleaning up stdout stream: ${error}`);
      }
    }

    if (this.stderrStream) {
      try {
        this.stderrStream.end();
        this.stderrStream.destroy();
        this.stderrStream = null;
      } catch (error) {
        this.logger.debug(`Error cleaning up stderr stream: ${error}`);
      }
    }
  }

  /**
   * Get or create worker thread with custom stream handling
   */
  protected getWorkerThread(): WorkerThread {
    if (this.isShuttingDown) {
      throw new WorkerIsShuttingDownError();
    }

    if (!this.workerThread) {
      const workerThreadPath = resolve(dir, './worker-thread/worker-thread.js');

      // Create custom streams with worker ID prefix for debugging
      this.stdoutStream = new WorkerLogger(false);
      this.stderrStream = new WorkerLogger(true);

      const workerOptions: WorkerOptions = {
        workerData: {
          filename: this.workerFilename,
          initialPayload: this.initialPayload,
          type: this.type,
        },
        stdout: true, // Enable stdout stream from worker
        stderr: true, // Enable stderr stream from worker
      };

      this.workerThread = new WorkerThread(workerThreadPath, workerOptions);

      // Pipe worker streams to our custom writable streams
      // This doesn't add listeners to process.stdout/stderr directly
      const workerStdout = this.workerThread.stdout;
      const workerStderr = this.workerThread.stderr;

      if (workerStdout && this.stdoutStream) {
        workerStdout.pipe(this.stdoutStream);

        // Handle pipe errors
        workerStdout.on('error', (err) => {
          this.logger.debug(`Worker stdout error: ${err.message}`);
        });
      }

      if (workerStderr && this.stderrStream) {
        workerStderr.pipe(this.stderrStream);

        // Handle pipe errors
        workerStderr.on('error', (err) => {
          this.logger.debug(`Worker stderr error: ${err.message}`);
        });
      }

      // Setup event listeners
      this.setupWorkerListeners();

      this.logger.debug('Worker thread created with custom stream handling');
    }
    return this.workerThread;
  }

  /**
   * Setup worker thread event listeners
   */
  private setupWorkerListeners(): void {
    if (!this.workerThread) return;

    // Clean up existing listeners first
    this.workerThread.removeAllListeners();

    this.workerThread.on('messageerror', (err) => {
      this.logger.error(`Message error: ${err.message}`);
    });

    this.workerThread.on('error', (err) => {
      this.logger.error(`Worker error: ${err.message}`);
      this.emit('worker.error', err);
      this.cleanupStreams();
    });

    this.workerThread.on('exit', (code) => {
      this.logger.info(`Worker exited with code ${code}`);
      this.cleanupStreams();
      this.workerThread = null;
      this.emit('worker.terminated');
    });
  }

  /**
   * Send a message and wait for response
   */
  protected postMessage(
    message: TWorkerThreadParentMessage,
    callback?: ICallback<Reply>,
  ): void {
    if (!callback) {
      callback = (err, reply): void => {
        if (err) this.emit('worker.error', err);
        if (reply) this.emit('worker.data', reply);
      };
    }

    if (this.isShuttingDown) {
      return callback(new WorkerIsShuttingDownError());
    }

    const worker = this.getWorkerThread();

    const onMessage = (msg: TWorkerThreadChildMessage<Reply>) => {
      worker.removeListener('message', onMessage);
      worker.removeListener('exit', onExit);

      if (msg.code === EWorkerThreadChildExecutionCode.OK) {
        callback(null, msg.data);
      } else {
        callback(new WorkerThreadError({ metadata: msg }));
      }
    };

    const onExit = (code: number) => {
      worker.removeListener('message', onMessage);
      worker.removeListener('exit', onExit);

      const error =
        code !== 0
          ? new WorkerThreadFailureError({
              metadata: {
                code,
              },
            })
          : null;
      callback(error);
    };

    worker.once('message', onMessage);
    worker.once('exit', onExit);
    worker.postMessage(message);
  }

  /**
   * Shutdown worker with proper cleanup
   */
  shutdown(cb: ICallback): void {
    if (this.isShuttingDown) {
      return cb(new WorkerIsShuttingDownError());
    }

    this.isShuttingDown = true;

    if (!this.workerThread) {
      this.cleanupStreams();
      this.removeFromGlobalList();
      return cb(null);
    }

    this.workerThread.removeAllListeners();

    this.workerThread
      .terminate()
      .then(() => {
        this.cleanupStreams();
        this.workerThread = null;
        this.isShuttingDown = false;
        this.removeFromGlobalList();
        cb(null);
      })
      .catch((err) => {
        this.isShuttingDown = false;
        cb(err);
      });
  }

  /**
   * Remove worker from global cleanup list
   */
  private removeFromGlobalList(): void {
    const index = allWorkers.indexOf(this);
    if (index > -1) {
      allWorkers.splice(index, 1);
    }
  }

  /**
   * Get worker ID
   */
  getId(): string {
    return this.id;
  }

  getWorkerFilename(): string {
    return this.workerFilename;
  }
}
