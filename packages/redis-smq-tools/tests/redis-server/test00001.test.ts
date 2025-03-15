/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { it } from 'vitest';
import {
  shutdownRedisServer,
  startRedisServer,
} from '../../src/redis-server/index.js';

it('Downloads, builds, and starts Redis server', async () => {
  const tag = Date.now();
  const dataDir = `../../data/${tag}`;
  let port = await startRedisServer(dataDir);
  console.log(`Redis server started on port ${port}`);
  await shutdownRedisServer(port);
  console.log(`Redis server has been shut down`);

  // If the tarball already exists, it will be used instead of downloading and build it again
  port = await startRedisServer(dataDir);
  console.log(`Redis server started on port ${port}`);
  await shutdownRedisServer(port);
  console.log(`Redis server has been shut down`);
});
