/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { _parseExchangeParams } from '../../_/_parse-exchange-params.js';
import { EExchangeType, IExchangeParams } from '../../types/index.js';

export function _getDirectExchangeRoutingKeys(
  redisClient: IRedisClient,
  exchange: string | IExchangeParams,
  cb: ICallback<string[]>,
): void {
  const exchangeParams = _parseExchangeParams(exchange, EExchangeType.DIRECT);
  if (exchangeParams instanceof Error) cb(exchangeParams);
  else {
    const { keyExchangeRoutingKeys } = redisKeys.getExchangeDirectKeys(
      exchangeParams.ns,
      exchangeParams.name,
    );
    redisClient.smembers(keyExchangeRoutingKeys, cb);
  }
}
