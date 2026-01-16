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
import { WorkerPayloadRequiredError } from './errors/index.js';
import {
  EWorkerThreadParentMessage,
  EWorkerType,
  ICallableWorker,
  TWorkerThreadParentMessageCall,
} from './types/index.js';
import { Worker } from './worker.js';

export class CallableWorker<Payload, Reply>
  extends Worker<Reply>
  implements ICallableWorker<Payload, Reply>
{
  protected readonly type: EWorkerType = EWorkerType.CALLABLE;

  constructor(workerFilename: string, logger: ILogger) {
    super(workerFilename, undefined, logger);
    this.logger.info(`CallableWorker instance created for ${workerFilename}`);
  }

  call(payload: Payload, cb: ICallback<Reply>) {
    this.logger.info(`Calling worker ${this.id}`);

    if (payload === null || payload === undefined) {
      this.logger.error('Worker call failed: payload is required');
      cb(new WorkerPayloadRequiredError());
      return;
    }

    const message: TWorkerThreadParentMessageCall = {
      type: EWorkerThreadParentMessage.CALL,
      payload,
    };

    this.logger.debug(
      'Posting CALL message to worker thread (request-response)',
    );

    // Use parent's postMessage which expects a callback
    super.postMessage(message, cb);
  }
}
