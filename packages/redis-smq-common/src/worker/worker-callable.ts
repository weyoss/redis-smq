/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../common/index.js';
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

  constructor(workerFilename: string) {
    super(workerFilename);
  }

  call(payload: Payload, cb: ICallback<Reply>) {
    if (payload === null || payload === undefined) {
      cb(new WorkerPayloadRequiredError());
    } else {
      this.registerEvents(cb);
      this.postMessage({ type: EWorkerThreadParentMessage.CALL, payload });
    }
  }
}
