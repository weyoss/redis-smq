#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import { RedisSMQRestApi } from '../src/index.js';
import { defaultConfig } from '../src/config/parseConfig.js';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';
import { IRedisSMQRestApiConfig } from '../src/config/types/index.js';

const program = new Command();

program
  .name('redis-smq-rest-api')
  .description(
    'REST API for RedisSMQ: OpenAPI 3 schema and Swagger UI for managing queues, messages, and consumers.',
  );

program
  .option(
    '-p, --port <port>',
    'Port to run the server on',
    String(defaultConfig.apiServer.port),
  )
  .option(
    '-B, --base-path <basePath>',
    'Base public path for Swagger UI',
    String(defaultConfig.apiServer.basePath),
  )
  .option(
    '-c, --redis-client <redisClient>',
    'Redis client. Valid options are: ioredis, redis.',
    defaultConfig.redis.client,
  )
  .option(
    '-H, --redis-host <redisHost>',
    'Redis server host',
    defaultConfig.redis.options.host,
  )
  .option(
    '-P, --redis-port <redisPort>',
    'Redis server port',
    String(defaultConfig.redis.options.port),
  )
  .option(
    '-d, --redis-db <redisDb>',
    'Redis database number',
    String(defaultConfig.redis.options.db),
  )
  .option(
    '-l, --enable-log <logEnabled>',
    'Enable console logging',
    String(defaultConfig.logger.enabled),
  )
  .option(
    '-v, --log-level <logLevel>',
    'Log level',
    EConsoleLoggerLevel[defaultConfig.logger.options.logLevel],
  );

//
program.parse();

interface IRedisSMQRestApiOptions {
  port: string;
  redisClient: ERedisConfigClient;
  basePath: string;
  redisPort: string;
  redisHost: string;
  redisDb: string;
  enableLog: string;
  logLevel: EConsoleLoggerLevel;
}

//
const options: IRedisSMQRestApiOptions = program.opts();

//
const config: IRedisSMQRestApiConfig = {
  apiServer: {
    port: Number(options.port),
    basePath: String(options.basePath),
  },
  redis: {
    client: options.redisClient,
    options: {
      port: Number(options.redisPort),
      host: options.redisHost,
      db: Number(options.redisDb),
    },
  },
  logger: {
    enabled: Boolean(options.enableLog),
    options: {
      logLevel: options.logLevel,
    },
  },
};

const server = new RedisSMQRestApi(config);
server.run();
