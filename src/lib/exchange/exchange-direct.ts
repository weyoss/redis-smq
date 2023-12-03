/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Exchange } from './exchange';
import {
  EExchangeType,
  IQueueParams,
  TExchangeDirectBindingParams,
} from '../../../types';
import { ICallback } from 'redis-smq-common';
import { _getQueueParams } from '../queue/queue/_get-queue-params';

export class ExchangeDirect extends Exchange<
  TExchangeDirectBindingParams,
  EExchangeType.DIRECT
> {
  constructor(queue: TExchangeDirectBindingParams) {
    super(queue, EExchangeType.DIRECT);
  }

  protected override validateBindingParams(
    queue: TExchangeDirectBindingParams,
  ): IQueueParams {
    return _getQueueParams(queue);
  }

  getQueues(cb: ICallback<IQueueParams[]>): void {
    const queue = _getQueueParams(this.bindingParams);
    cb(null, [queue]);
  }
}
