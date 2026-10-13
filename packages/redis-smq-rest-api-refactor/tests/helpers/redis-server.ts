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
  /** Ephemeral port the server bound to. */
  port: number;
  /** Stops the server. Safe to call once. */
  shutdown(): Promise<void>;
}

/**
 * Spawns a fresh embedded Redis on a random free port.
 *
 * Stateless: each call starts a new process and returns a handle to it.
 * The caller owns the lifecycle. This is intentional — the test setup
 * starts one per test, and no shared module state means no chance of
 * two tests silently reusing the same server.
 *
 * `RedisServer.start()` picks a free port by asking the OS to bind a
 * socket to port 0, so two test files running in parallel cannot
 * collide on a fixed port.
 */
export async function spawnRedis(): Promise<RedisInstance> {
  const server = new RedisServer();
  const port = await server.start();

  return {
    port,
    shutdown: () => server.shutdown(),
  };
}
