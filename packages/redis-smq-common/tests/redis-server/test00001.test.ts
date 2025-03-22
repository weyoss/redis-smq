/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { it } from 'vitest';
import { redisServer } from '../../src/redis-server/index.js';

it('Downloads, builds, and starts Redis server', async () => {
  const port = await redisServer.startRedisServer();
  await redisServer.shutdownRedisServer(port);
});
