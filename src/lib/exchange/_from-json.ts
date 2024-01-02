/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType, TExchange, TExchangeSerialized } from '../../../types';
import { ExchangeInvalidDataError } from './errors';
import { ExchangeFanOut } from './exchange-fan-out';
import { ExchangeTopic } from './exchange-topic';
import { ExchangeDirect } from './exchange-direct';

export function _fromJSON(json: Partial<TExchangeSerialized>): TExchange {
  if (!json.bindingParams || json.type === undefined)
    throw new ExchangeInvalidDataError();
  if (json.type === EExchangeType.FANOUT) {
    const e = new ExchangeFanOut(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
  if (json.type === EExchangeType.TOPIC) {
    const e = new ExchangeTopic(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
  if (json.type === EExchangeType.DIRECT) {
    const e = new ExchangeDirect(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
  throw new ExchangeInvalidDataError();
}
