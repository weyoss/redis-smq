/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IRedisSMQWebServerConfig,
  IRedisSMQWebServerParsedConfig,
} from './types/index.js';
import { parseConfig as parseRestApiConfig } from 'redis-smq-rest-api';

export const defaultConfig: IRedisSMQWebServerConfig = {
  webServer: {
    port: 8080,
    basePath: '/',
    apiProxyTarget: undefined,
  },
};

/**
 * @param config
 * @returns The parsed configuration, with default values applied.
 */
export function parseConfig(
  config: Partial<IRedisSMQWebServerConfig> = {},
): IRedisSMQWebServerParsedConfig {
  const restApiParsedConfig = parseRestApiConfig(config);
  const webServer = {
    ...defaultConfig.webServer,
    ...config.webServer,
  };
  // remove trailing '/'
  const basePath = String(webServer.basePath).replace(/\/+$/, '') || '/';
  return {
    ...restApiParsedConfig,
    apiServer: {
      ...restApiParsedConfig.apiServer,
      basePath: basePath,
    },
    webServer: {
      port: Number(webServer.port),
      basePath,
      apiProxyTarget: webServer.apiProxyTarget
        ? String(webServer.apiProxyTarget)
        : undefined,
    },
  };
}
