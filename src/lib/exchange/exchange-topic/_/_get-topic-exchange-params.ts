/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../../config/index.js';
import { ExchangeInvalidTopicParamsError } from '../../errors/exchange-invalid-topic-params.error.js';
import { ITopicParams } from '../../types/index.js';

export function _getTopicExchangeParams(
  topic: ITopicParams | string,
): ITopicParams | ExchangeInvalidTopicParamsError {
  const config = Configuration.getSetConfig();
  const topicParams =
    typeof topic === 'string'
      ? {
          topic: topic,
          ns: config.namespace,
        }
      : topic;
  const vTopic = redisKeys.validateRedisKey(topicParams.topic);
  if (vTopic instanceof Error) return new ExchangeInvalidTopicParamsError();
  const vNamespace = redisKeys.validateNamespace(topicParams.ns);
  if (vNamespace instanceof Error) return new ExchangeInvalidTopicParamsError();
  return {
    topic: vTopic,
    ns: vNamespace,
  };
}
