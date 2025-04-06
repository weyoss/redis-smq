/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { RedisServer } from '../../src/redis-server/index.js';

it('should start and shut down Redis server', async () => {
  const server = new RedisServer();
  const port = await server.start();
  expect(port).toBeGreaterThan(0);
  await server.shutdown();
});
