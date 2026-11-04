/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../async/index.js';
import { ILogger } from '../logger/index.js';
import { Lifecycle } from '../lifecycle/index.js';
import {
  WorkerAlreadyDownError,
  WorkerAlreadyRunningError,
} from './errors/index.js';
import {
  EWorkerThreadParentMessage,
  EWorkerType,
  IRunnableWorker,
  TWorkerThreadParentMessage,
} from './types/index.js';
import { Worker } from './worker.js';

export class RunnableWorker<InitialPayload>
  extends Worker<void>
  implements IRunnableWorker
{
  protected readonly type: EWorkerType = EWorkerType.RUNNABLE;
  protected readonly lifecycle: Lifecycle;

  constructor(
    workerFilename: string,
    initialPayload: InitialPayload,
    logger: ILogger,
  ) {
    super(workerFilename, initialPayload, logger);
    this.lifecycle = new Lifecycle();
    this.logger.debug(`RunnableWorker instance created for ${workerFilename}`);
  }

  /**
   * Run the worker in fire-and-forget mode.
   * No response expected from the worker thread.
   */
  run(cb: ICallback) {
    this.logger.debug(`Attempting to run worker ${this.id}`);

    if (!this.lifecycle.goingUp()) {
      this.logger.warn(`Cannot start worker ${this.id}: already running`);
      cb(new WorkerAlreadyRunningError());
      return;
    }

    this.logger.debug('Lifecycle state changed to going up');

    const message: TWorkerThreadParentMessage = {
      type: EWorkerThreadParentMessage.RUN,
    };

    this.logger.debug('Posting RUN message to worker thread (fire-and-forget)');

    try {
      this.postMessage(message);

      // Success - worker is running in background
      this.lifecycle.commit();
      this.logger.debug(
        `Worker ${this.id} started successfully (fire-and-forget)`,
      );
      cb(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(`Worker failed to start: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });
      this.lifecycle.rollback();
      cb(error);
    }
  }

  override shutdown(cb: ICallback) {
    this.logger.debug(`Attempting to shut down worker ${this.id}`);

    if (!this.lifecycle.goingDown()) {
      this.logger.warn(`Cannot shut down worker ${this.id}: already down`);
      cb(new WorkerAlreadyDownError());
      return;
    }

    this.logger.debug('Lifecycle state changed to going down');
    this.logger.debug('Calling parent shutdown method');

    super.shutdown((err) => {
      if (err) {
        this.logger.warn(
          `Error during worker ${this.id} shutdown: ${err.message}`,
          {
            error: err.message,
            stack: err.stack,
          },
        );
        // Still commit — the shutdown is best-effort and we're tearing
        // the worker down regardless of the underlying error.
      }
      this.logger.debug('Committing lifecycle state change');
      this.lifecycle.commit();
      this.logger.debug(`Worker ${this.id} shut down successfully`);
      cb(null);
    });
  }
}
