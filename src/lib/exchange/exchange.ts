/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EExchangeType,
  IExchange,
  IExchangeSerialized,
  IQueueParams,
} from '../../../types';
import { ICallback } from 'redis-smq-common';
import { v4 as uuid } from 'uuid';

export abstract class Exchange<
  TBindingParams,
  ExchangeType extends EExchangeType,
> implements IExchange<TBindingParams, ExchangeType>
{
  readonly type: ExchangeType;
  readonly bindingParams: TBindingParams;
  exchangeTag: string;

  protected constructor(bindingParams: TBindingParams, type: ExchangeType) {
    this.bindingParams = this.validateBindingParams(bindingParams);
    this.type = type;
    this.exchangeTag = this.generateExchangeTag();
  }

  protected generateExchangeTag(): string {
    return `${this.constructor.name
      .replace(/([a-z])([A-Z])/, '$1-$2')
      .toLowerCase()}-${uuid()}`;
  }

  getBindingParams(): TBindingParams {
    return this.bindingParams;
  }

  toJSON(): IExchangeSerialized<TBindingParams, ExchangeType> {
    return {
      exchangeTag: this.exchangeTag,
      bindingParams: this.bindingParams,
      type: this.type,
    };
  }

  fromJSON(
    JSON: Partial<IExchangeSerialized<TBindingParams, ExchangeType>>,
  ): void {
    if (JSON.exchangeTag) this.exchangeTag = JSON.exchangeTag;
  }

  protected abstract validateBindingParams(
    bindingParams: TBindingParams,
  ): TBindingParams;

  abstract getQueues(cb: ICallback<IQueueParams[]>): void;
}
