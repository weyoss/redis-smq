/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 } from 'uuid';
import { IQueueParams } from '../../../queue-manager/index.js';
import { ExchangeInvalidQueueParamsError } from '../../errors/index.js';
import {
  EExchangeType,
  TExchangeDirectTransferable,
} from '../../types/exchange.js';
import { _validateExchangeDirectParams } from './_validate-exchange-direct-params.js';

export function _getExchangeDirectTransferable(
  queue: string | IQueueParams,
): TExchangeDirectTransferable | ExchangeInvalidQueueParamsError {
  const params = _validateExchangeDirectParams(queue);
  if (params instanceof Error) return params;
  return {
    params,
    type: EExchangeType.DIRECT,
    exchangeTag: v4(),
  };
}
