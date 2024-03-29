/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../common/redis-keys/redis-keys.js';
import { IRedisSMQConfig } from './types/index.js';

const defaultNamespace = 'default';

export default function Namespace(userConfig: IRedisSMQConfig): string {
  if (!userConfig.namespace) return defaultNamespace;
  const ns = redisKeys.validateNamespace(userConfig.namespace);
  if (ns instanceof Error) throw ns;
  return ns;
}
