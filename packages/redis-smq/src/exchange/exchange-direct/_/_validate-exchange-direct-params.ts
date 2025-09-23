/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { _parseQueueParams } from '../../../queue-manager/_/_parse-queue-params.js';
import { IQueueParams } from '../../../queue-manager/index.js';
import { InvalidDirectExchangeParametersError } from '../../../errors/index.js';

export function _validateExchangeDirectParams(
  queue: string | IQueueParams,
): IQueueParams | InvalidDirectExchangeParametersError {
  const queueParams = _parseQueueParams(queue);
  if (queueParams instanceof Error)
    return new InvalidDirectExchangeParametersError();
  return queueParams;
}
