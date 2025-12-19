/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { ConfigurationNamespaceError } from '../errors/index.js';
import { defaultConfig } from './default-config.js';

export function parseNamespaceConfig(userConfig?: string): string {
  if (!userConfig) return defaultConfig.namespace;
  const ns = redisKeys.validateNamespace(userConfig);
  if (ns instanceof Error) throw new ConfigurationNamespaceError();
  return ns;
}
