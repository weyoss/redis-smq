/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../common/index.js';
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

  constructor(workerFilename: string, initialPayload?: InitialPayload) {
    super(workerFilename, initialPayload);
    this.powerSwitch = new PowerSwitch();
  }

  run(cb: ICallback<void>) {
    const r = this.powerSwitch.goingUp();
    if (r) {
      this.registerEvents(this);
      this.postMessage({ type: EWorkerThreadParentMessage.RUN });
      this.powerSwitch.commit();
      cb();
    } else cb(new WorkerAlreadyRunningError());
  }

  override shutdown(cb: ICallback<void>) {
    const r = this.powerSwitch.goingDown();
    if (r) {
      super.shutdown(() => {
        this.powerSwitch.commit();
        cb();
      });
    } else cb(new WorkerAlreadyDownError());
  }
}
