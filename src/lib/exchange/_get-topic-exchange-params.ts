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
import { RedisKeysError } from '../../common/redis-keys/redis-keys.error';

export function _getTopicExchangeParams(
  topic: TTopicParams | string,
): TTopicParams | RedisKeysError {
  const config = Configuration.getSetConfig();
  const topicParams =
    typeof topic === 'string'
      ? {
          topic: topic,
          ns: config.namespace,
        }
      : topic;
  const vTopic = redisKeys.validateRedisKey(topicParams.topic);
  if (vTopic instanceof Error) return vTopic;
  const vNamespace = redisKeys.validateNamespace(topicParams.ns);
  if (vNamespace instanceof Error) return vNamespace;
  return {
    topic: vTopic,
    ns: vNamespace,
  };
}
