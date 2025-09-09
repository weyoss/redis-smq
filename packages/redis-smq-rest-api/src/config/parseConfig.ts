/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IRedisSMQRestApiConfig,
  IRedisSMQRestApiParsedConfig,
} from './types/index.js';
import { parseConfig as parseRedisSMQConfig } from 'redis-smq';

export const DEFAULT_PORT = 7210;
export const DEFAULT_BASE_PATH = '/';

function normalizePath(path: string): string {
  const s = path
    .split('/')
    .map((i) => i.trim())
    .filter((i) => !!i)
    .join('/');
  return `/${s}`;
}

export function parseConfig(
  config: IRedisSMQRestApiConfig = {},
): IRedisSMQRestApiParsedConfig {
  const { apiServer = {}, ...rest } = config;
  const redisSMQConfigParsed = parseRedisSMQConfig(rest);

  return {
    ...redisSMQConfigParsed,
    apiServer: {
      port: apiServer.port ?? DEFAULT_PORT,
      basePath: normalizePath(apiServer.basePath ?? DEFAULT_BASE_PATH),
    },
  };
}
