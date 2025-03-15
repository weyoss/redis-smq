/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../../../src/common/index.js';
import { IWorkerRunnable } from '../../../../src/worker/index.js';

export default function myWorkerRunnable(): IWorkerRunnable {
  let interval: NodeJS.Timeout | null = null;
  return {
    run(cb: ICallback<void>) {
      interval = setInterval(() => void 0, 1000);
      cb();
    },
    shutdown(cb: ICallback<void>) {
      if (interval) clearInterval(interval);
      cb();
    },
  };
}
