/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../../src/async/index.js';

export default function myWorkerCallable(args: string, cb: ICallback<string>) {
  setTimeout(() => cb(null, args), 5000);
}
