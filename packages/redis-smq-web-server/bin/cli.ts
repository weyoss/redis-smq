/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import { RedisSMQWebServer } from '../src/index.js';
import { defaultConfig } from '../src/config/parse-config.js';

const program = new Command();

program
  .name('redis-smq-web-server')
  .description('Web server for RedisSMQ Web UI');

program
  .option(
    '-p, --port <port>',
    'Port to run the server on',
    String(defaultConfig.port),
  )
  .option(
    '-B, --base-path <basePath>',
    'base public path for the RedisSMQ Web UI SPA',
    String(defaultConfig.basePath),
  )
  .option(
    '-H, --redis-host <redisHost>',
    'Redis server host',
    defaultConfig.redisHost,
  )
  .option(
    '-P, --redis-port <redisPort>',
    'Redis server port',
    String(defaultConfig.redisPort),
  )
  .option(
    '-D, --redis-db <redisDB>',
    'Redis database number',
    String(defaultConfig.redisDB),
  )
  .option(
    '-x, --api-proxy-target <url>',
    'Proxy target for API (/api, /docs, /assets). Example: http://127.0.0.1:7210',
    defaultConfig.apiProxyTarget,
  );

program.parse();

const options = program.opts();
const server = new RedisSMQWebServer(options);
server.run();
