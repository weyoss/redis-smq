#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import { RedisSMQWebServer } from '../src/index.js';
import {
  IRedisSMQWebServerCliOptions,
  IRedisSMQWebServerConfig,
} from '../src/config/types/index.js';
import { defaultConfig } from '../src/config/parse-config.js';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';

const program = new Command();

program
  .name('redis-smq-web-server')
  .description('Web server for RedisSMQ Web UI');

program
  .option(
    '-p, --port <number>',
    'Port to run the server on',
    String(defaultConfig.webServer?.port),
  )
  .option(
    '-b, --base-path <string>',
    'Base public path for the RedisSMQ Web UI SPA',
    defaultConfig.webServer?.basePath,
  )
  .option(
    '-t, --api-proxy-target <string>',
    'Proxy target for API (/api, /swagger). Example: http://127.0.0.1:6000',
    defaultConfig.webServer?.apiProxyTarget,
  )
  .option(
    '-c, --redis-client <ioredis|redis>',
    'Redis client. Valid options are: ioredis, redis.',
    ERedisConfigClient.IOREDIS,
  )
  .option(
    // -h is reserved for help, so use -r for redis host
    '-r, --redis-host <string>',
    'Redis server host',
    '127.0.0.1',
  )
  .option(
    // Use -o for pOrt to avoid conflict with -p (server port)
    '-o, --redis-port <number>',
    'Redis server port',
    '6379',
  )
  .option('-d, --redis-db <number>', 'Redis database number', '0')
  .option(
    '-e, --enable-log <0|1>',
    'Enable console logging. Valid options are: 0, 1',
    '0',
  )
  .option(
    '-v, --log-level <0|1|2|3>',
    `Log level. Numbers: ${EConsoleLoggerLevel.DEBUG}=DEBUG, ${EConsoleLoggerLevel.INFO}=INFO, ${EConsoleLoggerLevel.WARN}=WARN, ${EConsoleLoggerLevel.ERROR}=ERROR`,
    'INFO',
  );

program.parse();

const options: IRedisSMQWebServerCliOptions = program.opts();

// Build a partial config from CLI options.
const config: IRedisSMQWebServerConfig = {
  webServer: {
    port: Number(options.port),
    basePath: options.basePath,
    apiProxyTarget: options.apiProxyTarget,
  },
  redis: {
    client: options.redisClient,
    options: {
      host: options.redisHost,
      port: Number(options.redisPort),
      db: Number(options.redisDb),
    },
  },
  logger: {
    enabled: Boolean(Number(options.enableLog)),
    options: {
      logLevel: Number(options.logLevel),
    },
  },
};

const server = new RedisSMQWebServer(config);
server.run();
