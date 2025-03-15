/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { Worker as WorkerThread } from 'worker_threads';
import { ICallback } from '../common/index.js';
import { getDirname } from '../env/index.js';
import { EventEmitter } from '../event/index.js';
import { WorkerThreadError } from './errors/index.js';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadChildExitCode,
  EWorkerType,
  TWorkerThreadChildMessage,
  TWorkerThreadParentMessage,
} from './types/index.js';

export type TWorkerEvent = {
  'worker.error': (err: Error) => void;
  'worker.data': (payload: unknown) => void;
};

const dir = getDirname();

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
  protected readonly workerFilename;
  protected readonly initialPayload;
  protected workerThread: WorkerThread | null = null;

  constructor(workerFilename: string, initialPayload?: unknown) {
    super();
    this.workerFilename = workerFilename;
    this.initialPayload = initialPayload;
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
      this.workerThread = new WorkerThread(
        resolve(dir, './worker-thread/worker-thread.js'),
        {
          workerData: {
            filename: this.workerFilename,
            initialPayload: this.initialPayload,
            type: this.type,
          },
        },
      );
      this.workerThread.on('messageerror', (err) => {
        console.error(err);
      });
      this.workerThread.on('error', (err) => {
        console.error(err);
      });
      this.workerThread.on('exit', () => {
        this.workerThread = null;
      });
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
    const worker = this.getWorkerThread();
    const cleanUp = () => {
      worker
        .removeListener('message', onMessage)
        .removeListener('exit', onExit);
    };
    const callback: ICallback<Reply> = (err, data) => {
      if (err) {
        if (cb instanceof Worker) {
          this.emit('worker.error', err);
        } else cb(err);
      } else {
        if (cb instanceof Worker) this.emit('worker.data', data);
        else cb(null, data);
      }
    };
    const onMessage = (msg: TWorkerThreadChildMessage<Reply>) => {
      cleanUp();
      if (msg.code !== EWorkerThreadChildExecutionCode.OK) {
        callback(new WorkerThreadError(msg));
      } else callback(null, msg.data);
    };
    const onExit = () => {
      cleanUp();
      const msg = {
        code: EWorkerThreadChildExitCode.TERMINATED,
        error: null,
      };
      callback(new WorkerThreadError(msg));
    };
    worker.once('message', onMessage);
    worker.once('exit', onExit);
  }

  postMessage(message: TWorkerThreadParentMessage): void {
    this.getWorkerThread().postMessage(message);
  }

  shutdown(cb: ICallback<void>) {
    const callback = () => {
      this.workerThread = null;
      cb();
    };
    if (this.workerThread) {
      this.workerThread.terminate().then(callback).catch(callback);
    } else cb();
  }
}
