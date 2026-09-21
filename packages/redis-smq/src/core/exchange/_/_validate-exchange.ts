/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import {
  ExchangeNotFoundError,
  ExchangeTypeMismatchError,
} from '../../errors/index.js';
import {
  EExchangeProperty,
  IExchangeParsedParams,
} from '../../../contracts/index.js';

export function _validateExchange(
  client: IRedisClient,
  exchange: IExchangeParsedParams,
  required: boolean,
  cb: ICallback,
) {
  const { keyExchange } = keys.getExchangeKeys(exchange.ns, exchange.name);
  client.hget(keyExchange, String(EExchangeProperty.TYPE), (err, reply) => {
    if (err) return cb(err);
    if (reply == null) {
      if (required) return cb(new ExchangeNotFoundError());
      return cb();
    }
    const existingType = Number(reply);
    if (existingType !== exchange.type) {
      return cb(
        new ExchangeTypeMismatchError({
          metadata: { expected: exchange.type, actual: existingType },
        }),
      );
    }
    cb();
  });
}
