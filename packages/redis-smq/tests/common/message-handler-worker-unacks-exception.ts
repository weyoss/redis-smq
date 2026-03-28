/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IMessageTransferable } from '../../src/index.js';
import { ICallback } from 'redis-smq-common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function myHandler(msg: IMessageTransferable, cb: ICallback) {
  throw new Error('THROW_ERROR');
}
