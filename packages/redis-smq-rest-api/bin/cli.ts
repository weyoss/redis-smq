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
import { RedisSMQRestApi } from '../src/index.js';
import {
  EConsoleLoggerLevel,
  ERedisConfigClient,
  TConsoleLoggerLevelName,
} from 'redis-smq-common';
import {
  DEFAULT_BASE_PATH,
  DEFAULT_PORT,
  IRedisSMQRestApiCliOptions,
  IRedisSMQRestApiConfig,
} from '../src/config/index.js';

const defaultLogLevel: TConsoleLoggerLevelName = 'INFO';

const program = new Command();

program.name('redis-smq-rest-api').description('RedisSMQ REST API server');

program
  // Server options
  .option(
    '-p, --port <number>',
    'Port to run the REST API on',
    String(DEFAULT_PORT),
  )
  .option(
    '-b, --base-path <string>',
    'Base path to mount the REST API under',
    DEFAULT_BASE_PATH,
  )

  // Redis options (short flags improved)
  .option(
    '-c, --redis-client <ioredis|redis>',
    'Redis client. Valid options are: ioredis, redis.',
    ERedisConfigClient.IOREDIS,
  )
  .option('-r, --redis-host <string>', 'Redis server host', '127.0.0.1')
  .option(
    // Use -o to avoid colliding with -p (API port)
    '-o, --redis-port <number>',
    'Redis server port',
    '6379',
  )
  .option('-d, --redis-db <number>', 'Redis database number', '0')

  // Logging options
  .option(
    '-e, --enable-log <0|1>',
    'Enable console logging: 0 (disabled), 1 (enabled)',
    '0',
  )
  .option(
    '-v, --log-level <0|1|2|3>',
    `Log level. Numbers: ${EConsoleLoggerLevel.DEBUG}=DEBUG, ${EConsoleLoggerLevel.INFO}=INFO, ${EConsoleLoggerLevel.WARN}=WARN, ${EConsoleLoggerLevel.ERROR}=ERROR`,
    String(defaultLogLevel),
  )

  // Note: -h is reserved by Commander for help
  .helpOption('-h, --help', 'Display help for command');

program.parse();

const options: IRedisSMQRestApiCliOptions = program.opts();

// Build config from parsed CLI options
const config: IRedisSMQRestApiConfig = {
  apiServer: {
    port: Number(options.port),
    basePath: options.basePath,
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

const api = new RedisSMQRestApi(config);
api.run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
