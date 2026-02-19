/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Runnable } from '../../../../src/runnable/index.js';
import { getDummyLogger } from '../../../../src/logger/index.js';
import { ICallback } from '../../../../src/async/index.js';

export default class MyRunnableWorker extends Runnable<Record<string, never>> {
  protected logger = getDummyLogger();
  protected interval: NodeJS.Timeout | null = null;

  override run(cb: ICallback): void {
    this.interval = setInterval(() => void 0, 1000);
    cb(null);
  }

  override shutdown(cb: ICallback<void>) {
    if (this.interval) clearInterval(this.interval);
    cb(null);
  }
}
