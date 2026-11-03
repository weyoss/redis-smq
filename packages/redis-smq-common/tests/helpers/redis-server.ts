/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisServer } from '../../src/redis-server/index.js';
import { setRedisPort } from './config.js';

let server: RedisServer | null = null;

export async function initializeRedis(): Promise<void> {
  if (server) return;
  server = new RedisServer();
  const port = await server.start();
  setRedisPort(port);
}

export async function shutDownRedisServer(): Promise<void> {
  if (!server) return;
  await server.shutdown();
  server = null;
}
