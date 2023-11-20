/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig } from '../../types';
import { redisKeys } from '../common/redis-keys/redis-keys';

const defaultNamespace = 'default';

export default function Namespace(userConfig: IRedisSMQConfig): string {
  if (!userConfig.namespace) return defaultNamespace;
  return redisKeys.validateNamespace(userConfig.namespace);
}
