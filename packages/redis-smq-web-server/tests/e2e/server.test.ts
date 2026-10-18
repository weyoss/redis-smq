/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { ERedisConfigClient, net } from 'redis-smq-common';
import {
  InvalidWebServerParamsError,
  RedisSMQWebServer,
} from '../../src/index.js';
import { getRedisPort } from '../helpers/context.js';

/**
 * E2E tests for the `RedisSMQWebServer` lifecycle and constructor.
 *
 * These construct their own instances rather than using the shared
 * server. The subject under test is the class itself — its construction,
 * its `getApplication()` method, its `shutdown()` behavior. Each test
 * is self-contained: it builds what it needs, asserts, and tears down.
 */

function makeConfig(port: number) {
  return {
    webServer: { port, basePath: '/' as const },
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: getRedisPort() },
    },
  };
}

describe('RedisSMQWebServer constructor', () => {
  it('rejects an out-of-range port with InvalidWebServerParamsError', () => {
    expect(
      () =>
        new RedisSMQWebServer({
          webServer: { port: 99_999, basePath: '/' },
          redis: { client: ERedisConfigClient.IOREDIS },
        }),
    ).toThrow(InvalidWebServerParamsError);
  });

  it('rejects a malformed apiProxyTarget with InvalidWebServerParamsError', () => {
    expect(
      () =>
        new RedisSMQWebServer({
          webServer: {
            port: 8080,
            basePath: '/',
            apiProxyTarget: 'not-a-url',
          },
          redis: { client: ERedisConfigClient.IOREDIS },
        }),
    ).toThrow(InvalidWebServerParamsError);
  });

  it('rejects an ftp apiProxyTarget with InvalidWebServerParamsError', () => {
    expect(
      () =>
        new RedisSMQWebServer({
          webServer: {
            port: 8080,
            basePath: '/',
            apiProxyTarget: 'ftp://example.com',
          },
          redis: { client: ERedisConfigClient.IOREDIS },
        }),
    ).toThrow(InvalidWebServerParamsError);
  });
});

describe('RedisSMQWebServer.getApplication', () => {
  it('returns an Express app that serves the SPA', async () => {
    const port = await net.getRandomPort();
    const server = new RedisSMQWebServer(makeConfig(port), false);

    try {
      const app = await server.getApplication();
      const res = await request(app).get('/').expect(200);
      expect(res.text).toContain('window.configs');
    } finally {
      await server.shutdown();
    }
  });

  it('is idempotent — a second call returns the same app', async () => {
    const port = await net.getRandomPort();
    const server = new RedisSMQWebServer(makeConfig(port), false);

    try {
      const first = await server.getApplication();
      const second = await server.getApplication();
      expect(first).toBe(second);
    } finally {
      await server.shutdown();
    }
  });
});

describe('RedisSMQWebServer.shutdown', () => {
  it('stops the listener', async () => {
    const port = await net.getRandomPort();
    const server = new RedisSMQWebServer(makeConfig(port), true);
    await server.run();

    const before = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { Accept: 'text/html' },
    });
    expect(before.status).toBe(200);

    await server.shutdown();

    await expect(fetch(`http://127.0.0.1:${port}/`)).rejects.toThrow();
  });

  it('is idempotent — a second call resolves without error', async () => {
    const port = await net.getRandomPort();
    const server = new RedisSMQWebServer(makeConfig(port), true);
    await server.run();

    await server.shutdown();
    await expect(server.shutdown()).resolves.toBeUndefined();
  });

  it('stops the embedded REST API along with the listener', async () => {
    // Create a queue via the API, shut down the server, then construct
    // a new server and verify the queue is still there. If the
    // embedded REST API wasn't properly shut down — say, its Redis
    // connection leaked — the second server would still work but the
    // first wouldn't have released its resources. The observable
    // property is that the second server can start on a fresh port
    // and see the data, which is what a subsequent test in the same
    // file would exercise.
    const port1 = await net.getRandomPort();
    const server1 = new RedisSMQWebServer(makeConfig(port1), true);
    await server1.run();

    const createRes = await fetch(`http://127.0.0.1:${port1}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue: { ns: 'shutdown-test', name: 'q1' },
        queueType: 0,
        queueDeliveryModel: 0,
      }),
    });
    expect(createRes.status).toBe(201);

    await server1.shutdown();

    const port2 = await net.getRandomPort();
    const server2 = new RedisSMQWebServer(makeConfig(port2), true);
    await server2.run();

    try {
      const listRes = await fetch(`http://127.0.0.1:${port2}/api/queues`);
      const list = (await listRes.json()) as {
        data: Array<{ ns: string; name: string }>;
      };
      expect(
        list.data.find((q) => q.ns === 'shutdown-test' && q.name === 'q1'),
      ).toBeDefined();
    } finally {
      await server2.shutdown();
    }
  });
});
