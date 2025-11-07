/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQWebServer } from '../../src/index.js';
import { config } from './config.js';

let webServer: RedisSMQWebServer | null = null;

export async function startWebServer() {
  if (!webServer) {
    webServer = new RedisSMQWebServer(config);
    await webServer.run();
  }
}

export async function shutdownWebServer() {
  if (webServer) {
    await webServer.shutdown();
    webServer = null;
  }
}
