/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { getRedisPort } from '../helpers/context.js';
import { startCli, type CliProcess } from '../helpers/start-cli.js';
import { startApi, type ApiInstance } from '../helpers/start-api.js';

/**
 * E2E tests for the `redis-smq-web-server` CLI.
 */

let cli: CliProcess | null = null;

afterEach(async () => {
  if (cli) {
    await cli.stop();
    cli = null;
  }
});

describe('CLI: default configuration', () => {
  it('serves the SPA and proxies the embedded API', async () => {
    cli = await startCli({
      redisPort: getRedisPort(),
      args: ['--base-path', '/', '--enable-log', '0'],
    });

    const root = await fetch(`${cli.url}/`, {
      headers: { Accept: 'text/html' },
    });
    expect(root.status).toBe(200);
    expect(root.headers.get('content-type')).toMatch(/text\/html/);
    expect(await root.text()).toContain('window.configs');

    const api = await fetch(`${cli.url}/api/queues`);
    expect(api.status).toBe(200);
    expect(api.headers.get('content-type')).toMatch(/application\/json/);
  });
});

describe('CLI: custom basePath', () => {
  it('redirects / and serves the SPA under the custom basePath', async () => {
    cli = await startCli({
      redisPort: getRedisPort(),
      args: ['--base-path', '/ui', '--enable-log', '0'],
    });

    const redirect = await fetch(`${cli.url}/`, { redirect: 'manual' });
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get('location')).toBe('/ui');

    const spa = await fetch(`${cli.url}/ui/`, {
      headers: { Accept: 'text/html' },
    });
    expect(spa.status).toBe(200);
    expect(spa.headers.get('content-type')).toMatch(/text\/html/);
    expect(await spa.text()).toContain('"BASE_PATH":"/ui"');

    const api = await fetch(`${cli.url}/ui/api/queues`);
    expect(api.status).toBe(200);
    expect(api.headers.get('content-type')).toMatch(/application\/json/);
  });
});

describe('CLI: proxy mode', () => {
  it('proxies /api and /swagger to the configured target', async () => {
    const upstream: ApiInstance = await startApi({
      redisPort: getRedisPort(),
    });

    try {
      cli = await startCli({
        redisPort: getRedisPort(),
        args: [
          '--base-path',
          '/',
          '--api-proxy-target',
          upstream.url,
          '--enable-log',
          '0',
        ],
      });

      const api = await fetch(`${cli.url}/api/queues`);
      expect(api.status).toBe(200);
      expect(api.headers.get('content-type')).toMatch(/application\/json/);

      const swagger = await fetch(`${cli.url}/swagger`);
      expect(swagger.status).toBe(200);
      expect(await swagger.text()).toContain('Swagger UI');

      const spa = await fetch(`${cli.url}/about`, {
        headers: { Accept: 'text/html' },
      });
      expect(spa.status).toBe(200);
      expect(spa.headers.get('content-type')).toMatch(/text\/html/);
    } finally {
      await upstream.shutdown();
    }
  });
});

describe('CLI: error handling', () => {
  it('exits non-zero with a clear message on an invalid --port', async () => {
    // `startCli` waits for readiness. When the CLI exits before the
    // listener is bound — which happens when `parseConfig` throws on
    // an out-of-range port — the helper throws with the captured
    // stderr, including the message from the CLI's error handler.
    //
    // The failure path is the assertion's subject, so this test
    // doesn't assign `cli` — there's no handle to clean up in
    // `afterEach`.
    let captured = '';
    try {
      await startCli({
        redisPort: getRedisPort(),
        args: ['--port', '99999', '--enable-log', '0'],
      });
    } catch (err) {
      captured = err instanceof Error ? err.message : String(err);
    }

    // The CLI prints `err.message`. If it also formats the metadata
    // (see `reportStartupError` in `src/cli.ts`), the output names
    // the field and the rejected value. The regex is tolerant of
    // both forms — a future improvement to the CLI's error formatting
    // shouldn't break this test.
    expect(captured).toMatch(/Invalid API server parameters|port/i);
  });
});
