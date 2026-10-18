/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisServer } from 'redis-smq-common';

export interface RedisInstance {
  port: number;
  shutdown(): Promise<void>;
}

let currentInstance: RedisInstance | null = null;

export async function spawnRedis(): Promise<RedisInstance> {
  const server = new RedisServer();
  const port = await server.start();

  const instance: RedisInstance = {
    port,
    shutdown: async () => {
      await server.shutdown();
      if (currentInstance === instance) currentInstance = null;
    },
  };
  currentInstance = instance;
  return instance;
}

export function getCurrentRedisPort(): number {
  if (!currentInstance) {
    throw new Error(
      'Redis has not been started. The test setup must call spawnRedis() ' +
        'in a beforeAll hook.',
    );
  }
  return currentInstance.port;
}
