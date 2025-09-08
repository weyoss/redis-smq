/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../common/redis-keys/redis-keys.js';
import { ConfigurationNamespaceError } from './errors/index.js';
import { IRedisSMQConfig } from './types/index.js';
import { defaultConfig } from './default-config.js';

export function getNamespaceConfig(userConfig: IRedisSMQConfig): string {
  if (!userConfig.namespace) return defaultConfig.namespace;
  const ns = redisKeys.validateNamespace(userConfig.namespace);
  if (ns instanceof Error) throw new ConfigurationNamespaceError();
  return ns;
}
