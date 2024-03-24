/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../queue/index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { _validateExchangeDirectParams } from './_/_validate-exchange-direct-params.js';

export class ExchangeDirect extends ExchangeAbstract<string | IQueueParams> {
  getQueues(
    exchangeParams: string | IQueueParams,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const queue = _validateExchangeDirectParams(exchangeParams);
    cb(null, [queue]);
  }
}
