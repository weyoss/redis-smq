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
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';
import {
  DEFAULT_BASE_PATH,
  DEFAULT_PORT,
  type IRedisSMQRestApiConfig,
} from './config/index.js';
import { RedisSMQRestApi } from './server.js';

/**
 * Command-line entry point.
 *
 * Parses CLI flags, assembles an `IRedisSMQRestApiConfig`, constructs
 * the server, and runs it. On shutdown (SIGINT/SIGTERM), the process
 * drains in-flight requests and closes the Redis connection cleanly.
 */

const program = new Command();

program
  .name('redis-smq-rest-api-refactor')
  .description('RedisSMQ REST API server')
  .version('0.0.1', '-V, --version', 'output the version number')

  // ── API server ─────────────────────────────────────────────────────
  .option(
    '-p, --port <number>',
    'port the REST API listens on',
    String(DEFAULT_PORT),
  )
  .option(
    '-b, --base-path <string>',
    'base path the REST API is mounted under',
    DEFAULT_BASE_PATH,
  )

  // ── Redis connection ───────────────────────────────────────────────
  .option(
    '-c, --redis-client <ioredis|redis>',
    'Redis client library',
    ERedisConfigClient.IOREDIS,
  )
  .option('-r, --redis-host <string>', 'Redis server host', '127.0.0.1')
  .option('-o, --redis-port <number>', 'Redis server port', '6379')
  .option('-d, --redis-db <number>', 'Redis database index', '0')

  // ── Logging ────────────────────────────────────────────────────────
  .option(
    '-e, --enable-log <0|1>',
    'enable console logging: 0 (off), 1 (on)',
    '0',
  )
  .option(
    '-v, --log-level <0|1|2|3>',
    `log level: ${EConsoleLoggerLevel.DEBUG}=DEBUG, ` +
      `${EConsoleLoggerLevel.INFO}=INFO, ` +
      `${EConsoleLoggerLevel.WARN}=WARN, ` +
      `${EConsoleLoggerLevel.ERROR}=ERROR`,
    String(EConsoleLoggerLevel.INFO),
  )

  .helpOption('-h, --help', 'display help for command');

program.parse();

const options = program.opts<{
  port: string;
  basePath: string;
  redisClient: ERedisConfigClient;
  redisHost: string;
  redisPort: string;
  redisDb: string;
  enableLog: string;
  logLevel: string;
}>();

// ─────────────────────────────────────────────────────────────────────
// Assemble the config
//
// Commander hands back strings for every flag — numeric and boolean
// ones included. The conversions below are deliberate and unguarded:
// `Number('abc')` yields `NaN`, which `parseConfig` rejects with a
// clear message. Adding a check here would duplicate that validation
// and produce two possible error formats for the same failure.
// ─────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────
// Run
//
// `parseConfig` (called from the constructor) may throw synchronously
// for a bad port or base path. `run()` may reject for a Redis
// connection failure or an occupied port. Both are fatal — the
// process cannot serve requests without them — so both terminate the
// process with a non-zero exit code and the error on stderr.
// ─────────────────────────────────────────────────────────────────────

let api: RedisSMQRestApi;

try {
  api = new RedisSMQRestApi(config);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

api.run().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────────
// Signal handling
//
// The library exposes `shutdown()` but deliberately does not install
// its own signal handlers — a library that overrides SIGTERM makes
// itself impossible to embed. The CLI owns the process, so it owns
// the handlers.
//
// `once` semantics (not `on`) so that a second SIGINT during a slow
// shutdown doesn't trigger a second `shutdown()` call. The `running`
// flag guards against a repeat call from a different signal.
// ─────────────────────────────────────────────────────────────────────

let running = true;

async function shutdown(signal: string): Promise<void> {
  if (!running) return;
  running = false;

  try {
    await api.shutdown();
  } catch (err) {
    console.error(
      `Error during shutdown: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    process.exit(signal === 'SIGINT' ? 130 : 143);
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
