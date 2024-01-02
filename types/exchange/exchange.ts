/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../queue';
import { ICallback } from 'redis-smq-common';
import { EExchangeType } from './common';

export interface IExchangeSerialized<
  BindingParams,
  ExchangeType extends EExchangeType,
> {
  readonly type: ExchangeType;
  readonly bindingParams: BindingParams;
  readonly exchangeTag: string;
}

export interface IExchange<BindingParams, ExchangeType extends EExchangeType>
  extends IExchangeSerialized<BindingParams, ExchangeType> {
  toJSON(): IExchangeSerialized<BindingParams, ExchangeType>;
  getQueues(cb: ICallback<IQueueParams[]>): void;
  getBindingParams(): BindingParams;
}
