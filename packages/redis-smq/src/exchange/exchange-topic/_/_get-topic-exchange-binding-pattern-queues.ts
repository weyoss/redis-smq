/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { IQueueParams } from '../../../queue-manager/index.js';
import { _parseExchangeParams } from '../../_/_parse-exchange-params.js';
import { EExchangeType, IExchangeParams } from '../../types/index.js';

export function _getTopicExchangeBindingPatternQueues(
  redisClient: IRedisClient,
  bindingPattern: string,
  exchange: string | IExchangeParams,
  cb: ICallback<IQueueParams[]>,
): void {
  const exchangeParams = _parseExchangeParams(exchange, EExchangeType.TOPIC);
  if (exchangeParams instanceof Error) cb(exchangeParams);
  else {
    const { keyBindingPatternQueues } =
      redisKeys.getExchangeTopicBindingPatternKeys(
        exchangeParams.ns,
        exchangeParams.name,
        bindingPattern,
      );
    redisClient.smembers(keyBindingPatternQueues, (err, reply) => {
      if (err) return cb(err);
      if (!reply) return cb(new CallbackEmptyReplyError());
      const queues: IQueueParams[] = reply.map((i) => JSON.parse(i));
      cb(null, queues);
    });
  }
}
