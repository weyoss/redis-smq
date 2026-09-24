/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { afterAll, beforeAll } from 'vitest';
import { RedisServer } from 'redis-smq-common';
import { redisConfig } from '../helpers/config/test-config.js';

/**
 * Per-worker global hooks. Imported by `vitest.setup.ts`.
 *
 * Starts an embedded Redis server for the worker, points
 * `redisConfig` at its port, and stops the server at worker exit.
 */

let server: RedisServer | null = null;

beforeAll(async () => {
  server = new RedisServer();
  const port = await server.start();

  if (typeof port !== 'number' || !Number.isFinite(port) || port <= 0) {
    await server.shutdown().catch(() => undefined);
    server = null;
    throw new Error(`Embedded Redis returned an invalid port: ${String(port)}`);
  }

  redisConfig.options = {
    ...redisConfig.options,
    port,
  };

  process.env.REDIS_PORT = String(port);
  process.env.REDIS_HOST ??= '127.0.0.1';
});

afterAll(async () => {
  if (server) {
    await server.shutdown().catch(() => undefined);
    server = null;
  }

  // Diagnostic: what keeps the worker alive after teardown?
  // `_getActiveHandles` and `_getActiveRequests` are undocumented
  // Node internals, but they are stable enough for a one-off
  // diagnostic and they tell you exactly what is preventing the
  // worker from exiting.
  // const handles: unknown[] =
  //   (
  //     process as unknown as { _getActiveHandles?: () => unknown[] }
  //   )._getActiveHandles?.() ?? [];
  // const requests: unknown[] =
  //   (
  //     process as unknown as { _getActiveRequests?: () => unknown[] }
  //   )._getActiveRequests?.() ?? [];
  //
  // console.error(
  //   `[global] afterAll: ${handles.length} active handle(s), ${requests.length} active request(s)`,
  // );
  // for (const h of handles) {
  //   const name =
  //     h && typeof h === 'object' && 'constructor' in h
  //       ? (h as { constructor: { name: string } }).constructor.name
  //       : typeof h;
  //   // For timers, log the delay. For sockets, log the peer address.
  //   const detail =
  //     name === 'Timeout'
  //       ? `delay=${
  //           (h as { _idleTimeout?: number })._idleTimeout ?? 'unknown'
  //         }ms`
  //       : name === 'Socket'
  //         ? `remote=${
  //             (h as { remoteAddress?: string }).remoteAddress ?? 'unknown'
  //           }:${(h as { remotePort?: number }).remotePort ?? 'unknown'}`
  //         : '';
  //   console.error(`[global]   handle: ${name} ${detail}`);
  // }
});
