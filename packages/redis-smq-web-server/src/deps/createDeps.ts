/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { createLogger } from 'redis-smq-common';
import { getDistPath } from 'redis-smq-web-ui';
import type { IParsedWebServerConfig } from '../config/index.js';
import { WebUIBundleNotFoundError } from '../errors/index.js';
import type { Deps } from './Deps.js';

export async function createDeps(
  config: IParsedWebServerConfig,
): Promise<Deps> {
  const webUIStaticDir = getDistPath();
  const spaIndexHtmlPath = join(webUIStaticDir, 'index.html');

  if (!existsSync(spaIndexHtmlPath)) {
    throw new WebUIBundleNotFoundError({
      metadata: { path: spaIndexHtmlPath },
    });
  }

  const rawHtml = await readFile(spaIndexHtmlPath, 'utf8');
  if (!rawHtml.includes('</head>')) {
    throw new WebUIBundleNotFoundError({
      metadata: {
        path: spaIndexHtmlPath,
        reason: 'expected </head> in index.html',
      },
    });
  }

  const { basePath } = config.webServer;
  const spaHtml = rawHtml.replace(
    '</head>',
    `<script>window.configs = ${JSON.stringify({
      BASE_PATH: basePath,
      API_URL: basePath,
    })};</script></head>`,
  );

  const logger = createLogger(config.logger, 'RedisSMQWebServer');

  if (config.webServer.apiProxyTarget !== null) {
    return {
      webUIStaticDir,
      spaHtml,
      logger,
      mode: 'proxy',
      restApi: null,
      embeddedApiHandler: null,
      proxyTarget: config.webServer.apiProxyTarget,
    };
  }

  const restApi = new RedisSMQRestApi(
    {
      apiServer: { basePath },
      redis: config.redis,
      logger: config.logger,
    },
    false,
  );

  // Start the REST API's internal state and resolve its request handler
  // once, here. Middleware factories and `buildApp` never await after
  // this point.
  const embeddedApiHandler = await restApi.getApplication();

  return {
    webUIStaticDir,
    spaHtml,
    logger,
    mode: 'embed',
    restApi,
    embeddedApiHandler,
    proxyTarget: null,
  };
}
