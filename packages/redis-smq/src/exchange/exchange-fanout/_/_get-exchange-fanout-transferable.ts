/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 } from 'uuid';
import { InvalidFanoutExchangeParametersError } from '../../../errors/index.js';
import {
  EExchangeType,
  TExchangeFanOutTransferable,
} from '../../types/exchange.js';
import { _validateExchangeFanoutParams } from './_validate-exchange-fanout-params.js';

export function _getExchangeFanOutTransferable(
  fanOutName: string,
): TExchangeFanOutTransferable | InvalidFanoutExchangeParametersError {
  const params = _validateExchangeFanoutParams(fanOutName);
  if (params instanceof Error) return params;
  return {
    params,
    type: EExchangeType.FANOUT,
    exchangeTag: v4(),
  };
}
