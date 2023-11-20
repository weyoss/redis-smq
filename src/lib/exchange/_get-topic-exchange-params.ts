/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TTopicParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { Configuration } from '../../config/configuration';

export function _getTopicExchangeParams(
  topic: TTopicParams | string,
): TTopicParams {
  const config = Configuration.getSetConfig();
  const topicParams =
    typeof topic === 'string'
      ? {
          topic: topic,
          ns: config.namespace,
        }
      : topic;
  return {
    topic: redisKeys.validateRedisKey(topicParams.topic),
    ns: redisKeys.validateNamespace(topicParams.ns),
  };
}
