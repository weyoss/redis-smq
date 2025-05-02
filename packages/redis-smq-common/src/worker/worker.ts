/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { randomUUID } from 'node:crypto';
import { resolve } from 'path';
import { Worker as WorkerThread } from 'worker_threads';
import { ICallback } from '../async/index.js';
import { env } from '../env/index.js';
import { EventEmitter } from '../event/index.js';
import { logger } from '../logger/index.js';
import { WorkerThreadError } from './errors/index.js';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadChildExitCode,
  EWorkerThreadParentMessage,
  EWorkerType,
  TWorkerThreadChildMessage,
  TWorkerThreadParentMessage,
} from './types/index.js';

export type TWorkerEvent = {
  'worker.error': (err: Error) => void;
  'worker.data': (payload: unknown) => void;
};

const dir = env.getCurrentDir();

/**
 * Abstract class representing a worker that executes in a separate thread.
 *
 * @template Payload - The type of payload that the worker accepts.
 * @template Reply - The type of reply that the worker returns.
 *
 * @extends EventEmitter<TWorkerEvent>
 */
export abstract class Worker<
  Payload,
  Reply,
> extends EventEmitter<TWorkerEvent> {
  protected abstract readonly type: EWorkerType;
  protected readonly id;
  protected readonly workerFilename;
  protected readonly initialPayload;
  protected workerThread: WorkerThread | null = null;
  protected logger;

  protected constructor(workerFilename: string, initialPayload?: unknown) {
    super();
    this.id = randomUUID();
    this.workerFilename = workerFilename;
    this.initialPayload = initialPayload;
    this.logger = logger.getLogger({ enabled: false });
    this.logger.info(`Worker instance created for ${workerFilename}`);
    this.logger.debug('Worker initialization details', {
      id: this.id,
      filename: workerFilename,
      initialPayload: this.initialPayload ? 'provided' : 'none',
    });
  }

  /**
   * Gets the worker ID.
   *
   * @returns The worker ID.
   */
  getId(): string {
    return this.id;
  }

  /**
   * Retrieves the worker thread instance. If the worker thread does not exist, it creates a new one.
   *
   * @returns The worker thread instance.
   *
   * @remarks
   * This method ensures that only one worker thread is created per instance of the `Worker` class.
   * If the worker thread has already been created, it returns the existing instance.
   * If the worker thread has been terminated, it creates a new one.
   *
   * The worker thread is initialized with the provided worker filename and initial payload.
   * It also sets up event listeners for 'messageerror', 'error', and 'exit' events.
   * If the worker thread exits, it sets the `workerThread` property to `null`.
   */
  protected getWorkerThread(): WorkerThread {
    if (!this.workerThread) {
      const workerThreadPath = resolve(dir, './worker-thread/worker-thread.js');
      this.logger.info(`Creating new worker thread from ${workerThreadPath}`);
      this.logger.debug('Worker thread configuration', {
        filename: this.workerFilename,
        type: EWorkerType[this.type],
        workerThreadPath,
      });

      try {
        this.workerThread = new WorkerThread(workerThreadPath, {
          workerData: {
            filename: this.workerFilename,
            initialPayload: this.initialPayload,
            type: this.type,
          },
          stdout: true,
        });
        this.logger.debug('Worker thread created successfully');

        // Capture worker stdout and redirect to logger
        if (this.workerThread.stdout) {
          this.logger.debug('Setting up stdout capture for worker thread');
          this.workerThread.stdout.on('data', (data: Buffer) => {
            const output = data.toString().trim();
            if (output) {
              this.logger.debug(output);
            }
          });
        } else {
          this.logger.warn('Worker thread stdout is not available');
        }

        // Capture worker stderr and redirect to logger
        if (this.workerThread.stderr) {
          this.logger.debug('Setting up stderr capture for worker thread');
          this.workerThread.stderr.on('data', (data: Buffer) => {
            const output = data.toString().trim();
            if (output) {
              this.logger.error(output);
            }
          });
        } else {
          this.logger.warn('Worker thread stderr is not available');
        }

        this.workerThread.on('messageerror', (err) => {
          this.logger.error(
            `Worker message deserialization error: ${err.message}`,
            {
              error: err.message,
              stack: err.stack,
              name: err.name,
            },
          );
        });

        this.workerThread.on('error', (err) => {
          this.logger.error(`Worker uncaught exception: ${err.message}`, {
            error: err.message,
            stack: err.stack,
            name: err.name,
          });
        });

        this.workerThread.on('exit', (code) => {
          if (code === 0) {
            this.logger.info('Worker thread exited successfully with code 0');
          } else {
            this.logger.warn(`Worker thread exited with code ${code}`);
          }
          this.workerThread = null;
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        this.logger.error(`Failed to create worker thread: ${error.message}`, {
          error: error.message,
          stack: error.stack,
        });
        throw err;
      }
    } else {
      this.logger.debug('Reusing existing worker thread');
    }
    return this.workerThread;
  }

  /**
   * Registers event listeners for the worker thread and handles the callback function.
   *
   * @param cb - The callback function or worker instance to handle the response.
   *
   * @remarks
   * This function sets up event listeners for the worker thread's 'message' and 'exit' events.
   * It also cleans up the event listeners after receiving a response or when the worker thread exits.
   *
   * If the provided callback is an instance of the `Worker` class, it emits 'worker.error' or 'worker.data' events.
   * Otherwise, it calls the callback function with an error or the received data.
   *
   * If the worker thread exits unexpectedly, it calls the callback function with a `WorkerThreadError` indicating termination.
   */
  protected registerEvents(
    cb: ICallback<Reply> | Worker<Payload, Reply>,
  ): void {
    try {
      const worker = this.getWorkerThread();
      this.logger.debug('Registering worker thread event handlers');

      const cleanUp = () => {
        this.logger.debug('Cleaning up worker thread event listeners');
        worker
          .removeListener('message', onMessage)
          .removeListener('exit', onExit);
      };

      const callback: ICallback<Reply> = (err, data) => {
        if (err) {
          this.logger.error(`Worker callback error: ${err.message}`, {
            error: err.message,
            stack: err.stack,
            name: err.name,
          });
          if (cb instanceof Worker) {
            this.logger.debug('Emitting worker.error event');
            this.emit('worker.error', err);
          } else {
            this.logger.debug('Calling error callback');
            cb(err);
          }
        } else {
          this.logger.debug('Worker callback success');
          if (cb instanceof Worker) {
            this.logger.debug('Emitting worker.data event');
            this.emit('worker.data', data);
          } else {
            this.logger.debug('Calling success callback');
            cb(null, data);
          }
        }
      };

      const onMessage = (msg: TWorkerThreadChildMessage<Reply>) => {
        this.logger.debug(
          `Received message from worker thread with code ${msg.code}`,
          {
            code: msg.code,
            hasData: msg.data !== undefined,
            hasError: msg.error !== null && msg.error !== undefined,
          },
        );

        cleanUp();

        if (msg.code !== EWorkerThreadChildExecutionCode.OK) {
          const errorCode =
            EWorkerThreadChildExecutionCode[msg.code] ||
            EWorkerThreadChildExitCode[msg.code] ||
            `Unknown(${msg.code})`;

          this.logger.error(`Worker thread execution error: ${errorCode}`, {
            code: msg.code,
            errorCode,
            error: msg.error,
          });
          callback(new WorkerThreadError(msg));
        } else {
          this.logger.debug('Worker thread execution successful');
          callback(null, msg.data);
        }
      };

      const onExit = (code: number) => {
        this.logger.warn(`Worker thread exited unexpectedly with code ${code}`);
        cleanUp();
        const msg = {
          code: EWorkerThreadChildExitCode.TERMINATED,
          error: null,
        };
        this.logger.error('Worker thread terminated', {
          exitCode: code,
          errorCode:
            EWorkerThreadChildExitCode[EWorkerThreadChildExitCode.TERMINATED],
        });
        callback(new WorkerThreadError(msg));
      };

      worker.once('message', onMessage);
      worker.once('exit', onExit);
      this.logger.debug('Worker thread event handlers registered successfully');
    } catch (err) {
      this.logger.error(
        `Failed to register worker thread events: ${err instanceof Error ? err.message : 'unknown error'}`,
        err,
      );
      throw err;
    }
  }

  /**
   * Posts a message to the worker thread.
   *
   * @param message - The message to post to the worker thread.
   */
  postMessage(message: TWorkerThreadParentMessage): void {
    try {
      this.logger.debug(
        `Posting message to worker thread: ${EWorkerThreadParentMessage[message.type]}`,
        {
          messageType: EWorkerThreadParentMessage[message.type],
          hasPayload: 'payload' in message && message.payload !== undefined,
        },
      );

      const worker = this.getWorkerThread();
      worker.postMessage(message);

      this.logger.debug('Message posted successfully to worker thread');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(
        `Failed to post message to worker thread: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
          messageType: message.type,
        },
      );
      throw err;
    }
  }

  /**
   * Shuts down the worker thread.
   *
   * @param cb - The callback function to call after shutdown.
   */
  shutdown(cb: ICallback<void>) {
    this.logger.info('Shutting down worker thread');

    const callback = () => {
      this.logger.info('Worker thread shutdown complete');
      this.workerThread = null;
      cb();
    };

    if (this.workerThread) {
      this.logger.debug('Terminating active worker thread');

      this.workerThread
        .terminate()
        .then((code) => {
          this.logger.debug(`Worker thread terminated with exit code ${code}`);
          callback();
        })
        .catch((err: Error) => {
          this.logger.error(`Error terminating worker thread: ${err.message}`, {
            error: err.message,
            stack: err.stack,
          });
          callback();
        });
    } else {
      this.logger.debug('No active worker thread to terminate');
      cb();
    }
  }
}
