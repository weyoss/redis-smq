/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Configuration } from '../../config/index.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  InvalidExchangeParametersError,
  RedisKeysInvalidKeyError,
} from '../../errors/index.js';
import {
  EExchangeType,
  IExchangeParams,
  IExchangeParsedParams,
} from '../types/index.js';

export function _parseExchangeParams(
  exchange: string | IExchangeParams,
  type: EExchangeType,
): IExchangeParsedParams | InvalidExchangeParametersError {
  const exchangeParams = _getExchangeParams(exchange);
  if (exchangeParams instanceof InvalidExchangeParametersError)
    return exchangeParams;
  return {
    ...exchangeParams,
    type,
  };
}

export function _getExchangeParams(
  exchange: string | IExchangeParams,
): IExchangeParams | InvalidExchangeParametersError {
  const exchangeParams =
    typeof exchange === 'string'
      ? { name: exchange, ns: Configuration.getConfig().namespace }
      : exchange;
  const ns = redisKeys.validateRedisKey(exchangeParams.ns);
  if (ns instanceof Error) return new InvalidExchangeParametersError();
  const name = redisKeys.validateRedisKey(exchangeParams.name);
  if (name instanceof RedisKeysInvalidKeyError)
    return new InvalidExchangeParametersError();
  return {
    ns,
    name,
  };
}
