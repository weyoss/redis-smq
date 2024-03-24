/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../queue/index.js';
import { _parseQueueParams } from '../../../queue/_/_parse-queue-params.js';

export function _validateExchangeDirectParams(
  queue: string | IQueueParams,
): IQueueParams {
  const queueParams = _parseQueueParams(queue);
  if (queueParams instanceof Error) throw queueParams;
  return queueParams;
}
