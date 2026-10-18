/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RedisSMQWebServer } from '../../src/index.js';
import { ERedisConfigClient, net } from 'redis-smq-common';
import { getRedisPort } from '../helpers/context.js';

/**
 * E2E tests for a custom base path.
 */

let server: RedisSMQWebServer;
let url: string;

beforeAll(async () => {
  const port = await net.getRandomPort();
  server = new RedisSMQWebServer(
    {
      webServer: { port, basePath: '/smq' },
      redis: {
        client: ERedisConfigClient.IOREDIS,
        options: { host: '127.0.0.1', port: getRedisPort() },
      },
    },
    true,
  );
  await server.run();
  url = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  if (server) await server.shutdown();
});

describe('custom basePath: redirect', () => {
  it('redirects GET / to /smq', async () => {
    const res = await fetch(`${url}/`, { redirect: 'manual' });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/smq');
  });

  it('preserves the query string through the redirect', async () => {
    const res = await fetch(`${url}/?campaign=xyz`, { redirect: 'manual' });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/smq?campaign=xyz');
  });
});

describe('custom basePath: SPA', () => {
  it('serves index.html at /smq/ with the custom BASE_PATH', async () => {
    // express.static redirects `/smq` → `/smq/` (trailing slash).
    // Follow the redirect to reach the file.
    const res = await fetch(`${url}/smq/`, {
      headers: { Accept: 'text/html' },
      redirect: 'follow',
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);

    const html = await res.text();
    expect(html).toContain('"BASE_PATH":"/smq"');
    expect(html).toContain('"API_URL":"/smq"');
  });

  it('serves the SPA fallback for /smq/queues', async () => {
    const res = await fetch(`${url}/smq/queues`, {
      headers: { Accept: 'text/html' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(await res.text()).toContain('window.configs');
  });
});

describe('custom basePath: embedded API', () => {
  it('serves /smq/api/queues from the embedded API', async () => {
    const res = await fetch(`${url}/smq/api/queues`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('does not serve /api (default root) when basePath is /smq', async () => {
    const res = await fetch(`${url}/api/queues`);

    // Request to the wrong path. Either the SPA fallback serves HTML
    // (if `Accept` permits it) or the response is a 404. Either way,
    // it is not the JSON the API would return.
    expect(res.headers.get('content-type')).not.toMatch(/application\/json/);
  });
});

describe('custom basePath: Swagger UI', () => {
  it('serves /smq/swagger', async () => {
    const res = await fetch(`${url}/smq/swagger`);

    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Swagger UI');
  });

  it('serves the spec at /smq/swagger/assets/openapi-specs.json', async () => {
    const res = await fetch(`${url}/smq/swagger/assets/openapi-specs.json`);

    expect(res.status).toBe(200);
    const spec = (await res.json()) as { openapi: string };
    expect(spec.openapi).toBe('3.1.0');
  });
});
