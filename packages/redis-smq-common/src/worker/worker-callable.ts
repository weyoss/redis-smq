/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../common/index.js';
import { ILogger } from '../logger/index.js';
import { WorkerPayloadRequiredError } from './errors/index.js';
import {
  EWorkerThreadParentMessage,
  EWorkerType,
  IWorkerCallable,
} from './types/index.js';
import { Worker } from './worker.js';

export class WorkerCallable<Payload, Reply>
  extends Worker<Payload, Reply>
  implements IWorkerCallable<Payload, Reply>
{
  protected readonly type: EWorkerType = EWorkerType.CALLABLE;

  constructor(workerFilename: string, logger?: ILogger) {
    super(workerFilename);
    this.logger = logger ?? this.logger;
    this.logger.info(`WorkerCallable instance created for ${workerFilename}`);
    this.logger.debug('WorkerCallable initialization details', {
      id: this.id,
      type: EWorkerType[this.type],
      hasCustomLogger: !!logger,
    });
  }

  call(payload: Payload, cb: ICallback<Reply>) {
    this.logger.info(`Calling worker ${this.id}`);
    this.logger.debug('Call details', {
      hasPayload: payload !== null && payload !== undefined,
      payloadType:
        payload !== null && payload !== undefined
          ? typeof payload
          : 'null/undefined',
    });

    if (payload === null || payload === undefined) {
      this.logger.error('Worker call failed: payload is required');
      cb(new WorkerPayloadRequiredError());
    } else {
      try {
        this.logger.debug('Registering worker thread event handlers');
        this.registerEvents(cb);

        this.logger.debug('Posting CALL message to worker thread');
        this.postMessage({ type: EWorkerThreadParentMessage.CALL, payload });

        this.logger.debug('Worker call initiated successfully');
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        this.logger.error(`Worker call failed: ${error.message}`, {
          error: error.message,
          stack: error.stack,
        });
        cb(error);
      }
    }
  }
}
