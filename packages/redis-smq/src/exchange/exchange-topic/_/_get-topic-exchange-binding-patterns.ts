/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { _parseExchangeParams } from '../../_/_parse-exchange-params.js';
import { EExchangeType, IExchangeParams } from '../../types/index.js';

export function _getTopicExchangeBindingPatterns(
  redisClient: IRedisClient,
  exchange: string | IExchangeParams,
  cb: ICallback<string[]>,
): void {
  const exchangeParams = _parseExchangeParams(exchange, EExchangeType.TOPIC);
  if (exchangeParams instanceof Error) cb(exchangeParams);
  else {
    const { keyExchangeBindingPatterns } = redisKeys.getExchangeTopicKeys(
      exchangeParams.ns,
      exchangeParams.name,
    );
    redisClient.smembers(keyExchangeBindingPatterns, cb);
  }
}
