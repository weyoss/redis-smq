/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { net } from 'redis-smq-common';
import { RedisSMQWebServer } from '../../src/index.js';
import { getRedisPort } from '../helpers/context.js';
import { startApi, type ApiInstance } from '../helpers/start-api.js';

/**
 * E2E tests for proxy mode.
 */

let upstream: ApiInstance | null = null;
let webServer: RedisSMQWebServer | null = null;
let webServerUrl: string | null = null;

beforeAll(async () => {
  upstream = await startApi({ redisPort: getRedisPort() });

  const port = await net.getRandomPort();
  webServer = new RedisSMQWebServer(
    {
      webServer: {
        port,
        basePath: '/',
        apiProxyTarget: upstream.url,
      },
    },
    true,
  );
  await webServer.run();
  webServerUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  // Guard against `beforeAll` failure: if the setup didn't complete,
  // these are still null. `afterAll` runs even when `beforeAll`
  // throws, so without the guards this would produce a second error
  // ("Cannot read properties of undefined") that obscures the
  // original one.
  if (webServer) await webServer.shutdown();
  if (upstream) await upstream.shutdown();
});

/**
 * Resolves `webServerUrl` with a non-null assertion.
 *
 * The tests only run when `beforeAll` succeeded, at which point the
 * URL is set. TypeScript can't see that — `beforeAll` is a callback,
 * not a synchronous assignment the compiler can verify. The helper
 * makes the narrowing explicit at each call site.
 */
function url(): string {
  if (!webServerUrl) {
    throw new Error(
      'webServerUrl not initialized. beforeAll must have failed.',
    );
  }
  return webServerUrl;
}

/**
 * Extracts the URL path from a `<script src>` in `index.html` and
 * normalizes it to an absolute path.
 *
 * The bundled HTML may reference assets as `/assets/main-hash.js`
 * (absolute), `./assets/main-hash.js` (relative), or a full URL. All
 * three forms should resolve to the same fetch target.
 */
function assetPath(scriptSrc: string): string {
  if (scriptSrc.startsWith('http')) {
    return new URL(scriptSrc).pathname;
  }
  if (scriptSrc.startsWith('/')) {
    return scriptSrc;
  }
  return `/${scriptSrc.replace(/^\.\//, '')}`;
}

describe('proxy mode', () => {
  it('proxies /api requests to the upstream', async () => {
    const res = await fetch(`${url()}/api/queues`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    const body = (await res.json()) as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('proxies POST bodies to the upstream', async () => {
    const res = await fetch(`${url()}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue: { ns: 'proxy-test', name: 'q1' },
        queueType: 0,
        queueDeliveryModel: 0,
      }),
    });
    expect(res.status).toBe(201);

    // Verify the write landed in the upstream by reading it back
    // through the same proxy. A regression where the proxy consumed
    // the body would show as a 400 from the upstream; a regression
    // where the proxy forwarded to the wrong path would show as a 404.
    const listRes = await fetch(`${url()}/api/queues`);
    const list = (await listRes.json()) as {
      data: Array<{ ns: string; name: string }>;
    };
    expect(
      list.data.find((q) => q.ns === 'proxy-test' && q.name === 'q1'),
    ).toBeDefined();
  });

  it('proxies /swagger to the upstream', async () => {
    const res = await fetch(`${url()}/swagger`);

    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Swagger UI');
  });

  it('proxies /swagger/assets/openapi-specs.json to the upstream', async () => {
    const res = await fetch(`${url()}/swagger/assets/openapi-specs.json`);

    expect(res.status).toBe(200);
    const spec = (await res.json()) as { openapi: string };
    expect(spec.openapi).toBe('3.1.0');
  });

  it('keeps SPA behavior for non-API routes', async () => {
    const res = await fetch(`${url()}/about`, {
      headers: { Accept: 'text/html' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(await res.text()).toContain('window.configs');
  });

  it('serves static assets locally, not from the upstream', async () => {
    // Fetch the SPA HTML, extract the first `<script src>`, then
    // fetch that asset from the web server. The web server serves
    // assets from `redis-smq-web-ui`'s bundle; the upstream API
    // knows nothing about them. If the proxy forwarded asset
    // requests to the upstream, this would 404.
    const htmlRes = await fetch(`${url()}/`, {
      headers: { Accept: 'text/html' },
    });
    expect(htmlRes.status).toBe(200);

    const match = (await htmlRes.text()).match(
      /<script[^>]+src=["']([^"']+)["']/i,
    );
    expect(match?.[1]).toBeDefined();

    const scriptSrc = match![1];
    const path = assetPath(scriptSrc);

    const assetRes = await fetch(`${url()}${path}`);
    expect(assetRes.status).toBe(200);
    expect(assetRes.headers.get('cache-control')).toMatch(/max-age=\d+/);
  });
});

describe('proxy mode — upstream unreachable', () => {
  it('returns 502 BadGateway when the upstream is down', async () => {
    // A second web server, this one pointing at a port with nothing
    // listening. The proxy's `on.error` handler should produce a 502
    // in the standard `{ error: { code, message } }` envelope.
    const deadPort = await net.getRandomPort();
    const webPort = await net.getRandomPort();

    const server = new RedisSMQWebServer(
      {
        webServer: {
          port: webPort,
          basePath: '/',
          apiProxyTarget: `http://127.0.0.1:${deadPort}`,
        },
      },
      true,
    );
    await server.run();

    try {
      const res = await fetch(`http://127.0.0.1:${webPort}/api/queues`);
      expect(res.status).toBe(502);

      const body = (await res.json()) as {
        error: { code: number; message: string };
      };
      expect(body.error.code).toBe(502);
      expect(body.error.message).toBe('BadGateway');
    } finally {
      await server.shutdown();
    }
  });
});
