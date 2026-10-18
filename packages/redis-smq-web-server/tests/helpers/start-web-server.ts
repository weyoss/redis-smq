/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient, net } from 'redis-smq-common';
import { type IWebServerConfig, RedisSMQWebServer } from '../../src/index.js';

export interface WebServerInstance {
  url: string;
  server: RedisSMQWebServer;
  shutdown(): Promise<void>;
}

export interface StartWebServerOptions {
  redisPort: number;
  overrides?: Partial<Omit<IWebServerConfig, 'webServer'>> & {
    webServer?: Omit<NonNullable<IWebServerConfig['webServer']>, 'port'>;
  };
}

export async function startWebServer(
  options: StartWebServerOptions,
): Promise<WebServerInstance> {
  const { redisPort, overrides = {} } = options;
  const port = await net.getRandomPort();

  const config: IWebServerConfig = {
    webServer: { port, basePath: '/', ...overrides.webServer },
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: redisPort },
      ...overrides.redis,
    },
    logger: { enabled: false, ...overrides.logger },
  };

  const server = new RedisSMQWebServer(config);
  await server.run();

  return {
    url: `http://127.0.0.1:${port}`,
    server,
    shutdown: () => server.shutdown(),
  };
}
