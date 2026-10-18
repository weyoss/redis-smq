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
  type IWebServerConfig,
} from './config/index.js';
import {
  InvalidWebServerParamsError,
  WebUIBundleNotFoundError,
  WebServerError,
} from './errors/index.js';
import { RedisSMQWebServer } from './server.js';

/**
 * Command-line entry point.
 *
 * Parses CLI flags, assembles an `IWebServerConfig`, constructs the
 * server, and runs it. On failure, prints a message tailored to the
 * error class and exits non-zero. On SIGINT/SIGTERM, drains in-flight
 * requests and closes the embedded REST API cleanly.
 */

const program = new Command();

program
  .name('redis-smq-web-server')
  .description('Web server for RedisSMQ Web UI')
  .version('0.0.1', '-V, --version', 'output the version number')

  // ── Web server ──────────────────────────────────────────────────────
  .option(
    '-p, --port <number>',
    'port to run the web server on',
    String(DEFAULT_PORT),
  )
  .option(
    '-b, --base-path <string>',
    'base public path for the RedisSMQ Web UI SPA',
    DEFAULT_BASE_PATH,
  )
  .option(
    '-t, --api-proxy-target <string>',
    'proxy target for API (/api, /swagger). Example: http://127.0.0.1:6000',
  )

  // ── Redis connection (used only in embed mode) ─────────────────────
  .option(
    '-c, --redis-client <ioredis|redis>',
    'Redis client library. Ignored in proxy mode.',
    ERedisConfigClient.IOREDIS,
  )
  .option(
    '-r, --redis-host <string>',
    'Redis server host. Ignored in proxy mode.',
    '127.0.0.1',
  )
  .option(
    '-o, --redis-port <number>',
    'Redis server port. Ignored in proxy mode.',
    '6379',
  )
  .option(
    '-d, --redis-db <number>',
    'Redis database index. Ignored in proxy mode.',
    '0',
  )

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
  apiProxyTarget?: string;
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
// Commander hands back strings for every flag, numeric and boolean
// ones included. The conversions below are deliberate and unguarded —
// `Number('abc')` yields `NaN`, which `parseConfig` rejects with a
// clear message.
//
// `redis` is included even in proxy mode where it's ignored. The
// `createDeps` function discards it in proxy mode, so leaving it in
// the config costs nothing; including it unconditionally keeps the CLI
// logic simple and lets a user toggle modes without having to re-pass
// every flag.
// ─────────────────────────────────────────────────────────────────────

const config: IWebServerConfig = {
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

// ─────────────────────────────────────────────────────────────────────
// Run
//
// The constructor may throw synchronously for invalid config. `run()`
// may reject for a missing Web UI bundle, an unreachable Redis, or an
// occupied port. Every failure mode has a distinct error class, and
// the catch block below surfaces the relevant metadata for each.
// ─────────────────────────────────────────────────────────────────────

let server: RedisSMQWebServer;

try {
  server = new RedisSMQWebServer(config);
} catch (err) {
  reportStartupError(err);
}

async function main(): Promise<void> {
  try {
    await server.run();
  } catch (err) {
    reportStartupError(err);
  }
}

/**
 * Formats a startup error for the CLI's stderr and exits non-zero.
 *
 * The three error classes this package can throw during startup each
 * have actionable metadata that a plain stack trace doesn't surface:
 *
 *   - `InvalidWebServerParamsError` — names the offending field, its
 *     value, and the reason. A user who typed `--port 99999` sees
 *     "invalid port 99999: must be between 1 and 65535" instead of a
 *     stack trace into `parseConfig`.
 *
 *   - `WebUIBundleNotFoundError` — names the missing file path. A
 *     user who forgot to install or build `redis-smq-web-ui` sees
 *     exactly which file the server was looking for.
 *
 *   - Anything else — printed as a full stack. A generic error
 *     indicates a bug in the package or in a peer dependency;
 *     the stack is the diagnostic.
 */
function reportStartupError(err: unknown): never {
  if (err instanceof InvalidWebServerParamsError) {
    const { field, value, reason } = err.metadata ?? {};
    console.error(
      `Invalid configuration: ${field} ${reason} (got ${JSON.stringify(value)})`,
    );
    process.exit(1);
  }

  if (err instanceof WebUIBundleNotFoundError) {
    const { path, reason } = err.metadata ?? {};
    console.error(`Web UI bundle could not be loaded:`);
    console.error(`  Path: ${path}`);
    if (reason) console.error(`  Reason: ${reason}`);
    console.error(
      'Rebuild redis-smq-web-ui and ensure its dist directory is present.',
    );
    process.exit(1);
  }

  if (err instanceof WebServerError) {
    // A package error without a specific format. Print the message
    // and metadata for the operator to inspect.
    console.error(err.message);
    if (err.metadata) {
      console.error(JSON.stringify(err.metadata, null, 2));
    }
    process.exit(1);
  }

  // Unknown error — full stack.
  console.error(err);
  process.exit(1);
}

void main();

// ─────────────────────────────────────────────────────────────────────
// Signal handling
//
// `RedisSMQWebServer` exposes `shutdown()` but does not install its
// own signal handlers — a library that overrides SIGTERM makes itself
// impossible to embed. The CLI owns the process, so it owns the
// handlers.
// ─────────────────────────────────────────────────────────────────────

let running = true;

async function shutdown(signal: string): Promise<void> {
  if (!running) return;
  running = false;

  try {
    await server.shutdown();
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
