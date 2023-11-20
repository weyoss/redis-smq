/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IRedisSMQConfigRequired } from '../../types';
import { merge } from 'lodash';
import { ERedisConfigClient } from 'redis-smq-common';

const defaultConfig: IRedisSMQConfigRequired['redis'] = {
  client: ERedisConfigClient.IOREDIS,
};

export default function Redis(
  userConfig: IRedisSMQConfig,
): IRedisSMQConfigRequired['redis'] {
  return merge({}, defaultConfig, userConfig.redis ?? {});
}
