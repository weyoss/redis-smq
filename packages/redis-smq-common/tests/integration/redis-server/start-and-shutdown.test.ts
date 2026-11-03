/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { RedisServer } from '../../../src/redis-server/index.js';

it('starts a real Redis server on an ephemeral port and shuts it down', async () => {
  const server = new RedisServer();
  const port = await server.start();

  expect(port).toBeGreaterThan(0);
  expect(port).toBeLessThan(65_536);

  await server.shutdown();
});
