/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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

  // Normalize a URL path and ensure it starts with a '/' and has no trailing
  // slash (unless it's just '/').
  const normalizePath = (path: string): string => {
    const s = path
      .split('/')
      .map((i) => i.trim())
      .filter((i) => !!i)
      .join('/');
    return `/${s}`;
  };

  // Determine the definitive basePath. The webServer config takes precedence over apiServer.
  // If webServer.basePath is not set, we respect the value from the apiServer config,
  // which has already been parsed and defaulted by parseRestApiConfig.
  const basePath =
    config.webServer?.basePath !== undefined
      ? normalizePath(config.webServer.basePath)
      : restApiParsedConfig.apiServer.basePath;

  // Combine web server configs, with user-provided values taking precedence.
  const webServer = {
    ...defaultConfig.webServer,
    ...config.webServer,
  };

  return {
    ...restApiParsedConfig,
    apiServer: {
      ...restApiParsedConfig.apiServer,
      basePath: basePath, // Ensure both use the same, correct basePath
    },
    webServer: {
      port: Number(webServer.port),
      basePath: basePath,
      apiProxyTarget: webServer.apiProxyTarget
        ? String(webServer.apiProxyTarget)
        : undefined,
    },
  };
}
