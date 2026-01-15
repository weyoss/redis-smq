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
import { PowerSwitch } from '../power-switch/index.js';
import {
  WorkerAlreadyDownError,
  WorkerAlreadyRunningError,
} from './errors/index.js';
import {
  EWorkerThreadParentMessage,
  EWorkerType,
  IWorkerRunnable,
  TWorkerThreadParentMessage,
} from './types/index.js';
import { Worker } from './worker.js';

export class WorkerRunnable<InitialPayload>
  extends Worker<void>
  implements IWorkerRunnable
{
  protected readonly type: EWorkerType = EWorkerType.RUNNABLE;
  protected readonly powerSwitch;

  constructor(
    workerFilename: string,
    initialPayload: InitialPayload,
    logger: ILogger,
  ) {
    super(workerFilename, initialPayload, logger);
    this.powerSwitch = new PowerSwitch();
    this.logger.info(`WorkerRunnable instance created for ${workerFilename}`);
  }

  /**
   * Run the worker in fire-and-forget mode
   * No response expected from worker thread
   */
  run(cb: ICallback) {
    this.logger.info(`Attempting to run worker ${this.id}`);

    const r = this.powerSwitch.goingUp();
    if (r) {
      this.logger.debug('Power switch state changed to going up');

      const message: TWorkerThreadParentMessage = {
        type: EWorkerThreadParentMessage.RUN,
      };

      this.logger.debug(
        'Posting RUN message to worker thread (fire-and-forget)',
      );

      try {
        this.postMessage(message);

        // Success - worker is running in background
        this.powerSwitch.commit();
        this.logger.info(
          `Worker ${this.id} started successfully (fire-and-forget)`,
        );
        cb(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        this.logger.error(`Worker failed to start: ${error.message}`, {
          error: error.message,
          stack: error.stack,
        });
        this.powerSwitch.rollback();
        cb(error);
      }
    } else {
      this.logger.warn(`Cannot start worker ${this.id}: already running`);
      cb(new WorkerAlreadyRunningError());
    }
  }

  override shutdown(cb: ICallback) {
    this.logger.info(`Attempting to shut down worker ${this.id}`);

    const r = this.powerSwitch.goingDown();
    if (r) {
      this.logger.debug('Power switch state changed to going down');

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
          // Still commit since we're shutting down regardless of errors
        }
        this.logger.debug('Committing power switch state change');
        this.powerSwitch.commit();
        this.logger.info(`Worker ${this.id} shut down successfully`);
        cb(null); // Always call with null for success
      });
    } else {
      this.logger.warn(`Cannot shut down worker ${this.id}: already down`);
      cb(new WorkerAlreadyDownError());
    }
  }
}
