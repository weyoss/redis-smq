/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { IQueueParams } from '../../queue/index.js';
import { _getFanOutExchangeQueues } from '../exchange-fan-out/_/_get-fan-out-exchange-queues.js';
import { _getTopicExchangeQueues } from '../exchange-topic/_/_get-topic-exchange-queues.js';
import { EExchangeType, TExchangeTransferable } from '../types/index.js';

export function _getExchangeQueues(
  redisClient: IRedisClient,
  exchangeParams: TExchangeTransferable,
  cb: ICallback<IQueueParams[]>,
) {
  if (exchangeParams.type === EExchangeType.TOPIC) {
    _getTopicExchangeQueues(redisClient, exchangeParams.params, cb);
  } else if (exchangeParams.type === EExchangeType.FANOUT) {
    _getFanOutExchangeQueues(redisClient, exchangeParams.params, cb);
  } else {
    cb(null, [exchangeParams.params]);
  }
}
