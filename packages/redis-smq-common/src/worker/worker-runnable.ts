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
} from './types/index.js';
import { Worker } from './worker.js';

export class WorkerRunnable<InitialPayload>
  extends Worker<void, void>
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
    this.logger.debug('WorkerRunnable initialization details', {
      id: this.id,
      type: EWorkerType[this.type],
      initialPayload: this.initialPayload ? 'provided' : 'none',
    });
  }

  run(cb: ICallback<void>) {
    this.logger.info(`Attempting to run worker ${this.id}`);

    const r = this.powerSwitch.goingUp();
    if (r) {
      this.logger.debug('Power switch state changed to going up');

      this.logger.debug('Registering worker thread event handlers');
      this.registerEvents(this);

      this.logger.debug(`Posting RUN message to worker thread`);
      this.postMessage({ type: EWorkerThreadParentMessage.RUN });

      this.logger.debug('Committing power switch state change');
      this.powerSwitch.commit();

      this.logger.info(`Worker ${this.id} started successfully`);
      cb();
    } else {
      this.logger.warn(`Cannot start worker ${this.id}: already running`);
      cb(new WorkerAlreadyRunningError());
    }
  }

  override shutdown(cb: ICallback<void>) {
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
        }
        this.logger.debug('Committing power switch state change');
        this.powerSwitch.commit();
        this.logger.info(`Worker ${this.id} shut down successfully`);
        cb();
      });
    } else {
      this.logger.warn(`Cannot shut down worker ${this.id}: already down`);
      cb(new WorkerAlreadyDownError());
    }
  }
}
