/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 } from 'uuid';
import { ExchangeInvalidFanOutParamsError } from '../../errors/index.js';
import {
  EExchangeType,
  TExchangeFanOutTransferable,
} from '../../types/exchange.js';
import { _validateExchangeFanOutParams } from './_validate-exchange-fan-out-params.js';

export function _getExchangeFanOutTransferable(
  fanOutName: string,
): TExchangeFanOutTransferable | ExchangeInvalidFanOutParamsError {
  const params = _validateExchangeFanOutParams(fanOutName);
  if (params instanceof Error) return params;
  return {
    params,
    type: EExchangeType.FANOUT,
    exchangeTag: v4(),
  };
}
