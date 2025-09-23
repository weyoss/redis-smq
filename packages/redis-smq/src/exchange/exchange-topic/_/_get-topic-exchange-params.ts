/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { InvalidTopicExchangeParamsError } from '../../../errors/index.js';
import { ITopicParams } from '../../types/index.js';

export function _getTopicExchangeParams(
  topic: ITopicParams | string,
): ITopicParams | InvalidTopicExchangeParamsError {
  const config = Configuration.getConfig();
  const topicParams =
    typeof topic === 'string'
      ? {
          topic: topic,
          ns: config.namespace,
        }
      : topic;

  // Validate topic as a regular expression
  try {
    new RegExp(topicParams.topic);
  } catch {
    return new InvalidTopicExchangeParamsError();
  }

  const vNamespace = redisKeys.validateNamespace(topicParams.ns);
  if (vNamespace instanceof Error) return new InvalidTopicExchangeParamsError();

  return {
    topic: topicParams.topic, // Keep original topic pattern (no transformation needed)
    ns: vNamespace,
  };
}
