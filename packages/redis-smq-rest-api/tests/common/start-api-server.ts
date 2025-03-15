/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { net } from 'redis-smq-tools';
import { RedisSmqRestApi } from '../../index.js';
import { config } from './config.js';

const { getRandomPort } = net;
let server: RedisSmqRestApi | null = null;

export async function startApiServer() {
  if (!server) {
    const port = await getRandomPort();
    config.apiServer = config.apiServer || {};
    config.apiServer.port = port;
    server = new RedisSmqRestApi(config);
    await server.run();
  }
}

export async function stopApiServer() {
  if (server) {
    await server.shutdown();
    server = null;
  }
}
