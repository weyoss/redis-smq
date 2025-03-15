/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IMessageParams } from '../../src/lib/index.js';

export default function myHandler(msg: IMessageParams, cb: ICallback<void>) {
  cb(new Error('MY_ERROR'));
}
