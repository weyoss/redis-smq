/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IMessageParams } from '../../types';
import { ICallback } from 'redis-smq-common';

export default function myHandler(msg: IMessageParams, cb: ICallback<void>) {
  cb();
}
