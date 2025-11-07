/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { net } from 'redis-smq-common';
import { config } from './config.js';
import { IRedisSMQRestApiConfig, RedisSMQRestApi } from 'redis-smq-rest-api';

let server: RedisSMQRestApi | null = null;

export async function startApiServer() {
  if (!server) {
    const port = await net.getRandomPort();
    const cfg: IRedisSMQRestApiConfig = config;
    cfg.apiServer = cfg.apiServer || {};
    cfg.apiServer.port = port;
    server = new RedisSMQRestApi(cfg);
    await server.run();
    return port;
  }
}

export async function stopApiServer() {
  if (server) {
    await server.shutdown();
    server = null;
  }
}
