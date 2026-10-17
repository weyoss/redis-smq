/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient, net } from 'redis-smq-common';
import { IRedisSMQRestApiConfig, RedisSMQRestApi } from '../../src/index.js';

export interface StartApiOptions {
  /** Port the embedded Redis is listening on. */
  redisPort: number;

  /** Optional overrides for the server config. `port` is always regenerated. */
  overrides?: Partial<Omit<IRedisSMQRestApiConfig, 'apiServer'>> & {
    apiServer?: Omit<NonNullable<IRedisSMQRestApiConfig['apiServer']>, 'port'>;
  };
}

export interface ApiInstance {
  /** Base URL, e.g. `http://127.0.0.1:54321`. */
  url: string;

  /** The underlying instance, for tests that need the Koa callback. */
  api: RedisSMQRestApi;

  /** Stops the HTTP server and shuts down the runtime. */
  shutdown(): Promise<void>;
}

/**
 * Boots a `RedisSMQRestApi` instance against the given Redis port.
 *
 * Stateless: each call constructs, runs, and returns a handle. The
 * caller (`vitest.setup.ts`) owns the lifecycle. The listening port
 * is always a random free one — callers cannot pin it, because doing
 * so would reintroduce the `EADDRINUSE` race the random port exists
 * to prevent.
 */
export async function startApi(options: StartApiOptions): Promise<ApiInstance> {
  const { redisPort, overrides = {} } = options;
  const port = await net.getRandomPort();

  const config: IRedisSMQRestApiConfig = {
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: redisPort },
    },
    ...overrides,
    apiServer: {
      ...overrides.apiServer,
      port,
    },
  };

  const api = new RedisSMQRestApi(config);
  await api.run();

  return {
    url: `http://127.0.0.1:${port}`,
    api,
    shutdown: () => api.shutdown(),
  };
}
