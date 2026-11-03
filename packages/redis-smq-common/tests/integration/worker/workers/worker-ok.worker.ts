/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../../../src/async/index.js';

export default function myCallableWorker(args: string, cb: ICallback<string>) {
  // Was 5000ms — reduced so tests finish in ~100ms instead of ~5s. The
  // assertion is on the reply, not on timing.
  setTimeout(() => cb(null, args), 100);
}
