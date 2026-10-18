/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { webServerUrl } from '../helpers/context.js';

/**
 * E2E tests for the SPA serving layer.
 *
 * The setup file boots a web server in embed mode at `basePath: '/'`.
 * These tests exercise the static-file middleware, the SPA fallback,
 * and the cache-header policy — everything that runs before a request
 * reaches the embedded REST API.
 *
 * The custom-basePath case is covered in `base-path.test.ts`; these
 * tests assume the default `/` mount.
 */

describe('SPA serving', () => {
  it('serves index.html at / with injected config', async () => {
    const res = await fetch(`${webServerUrl()}/`, {
      headers: { Accept: 'text/html' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);

    const html = await res.text();
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('window.configs');
    expect(html).toContain('"BASE_PATH":"/"');
    expect(html).toContain('"API_URL":"/"');
  });

  it('serves index.html for non-API SPA routes', async () => {
    const res = await fetch(`${webServerUrl()}/queues/demo/messages/123`, {
      headers: { Accept: 'text/html' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    // Same injected config as the root — the fallback doesn't re-render.
    expect(await res.text()).toContain('"BASE_PATH":"/"');
  });

  it('does not serve index.html for /api routes', async () => {
    const res = await fetch(`${webServerUrl()}/api/queues`);

    // The embedded API responds with JSON, not HTML. A regression
    // where the SPA fallback intercepts /api would produce HTML here
    // and break every API client.
    expect(res.headers.get('content-type')).not.toMatch(/text\/html/);
  });

  it('does not serve index.html for /swagger routes', async () => {
    const res = await fetch(`${webServerUrl()}/swagger`);

    expect(res.status).toBe(200);
    const html = await res.text();
    // Swagger UI HTML, not the SPA HTML. Both contain `<!doctype html>`,
    // so the distinguishing content is the Swagger-specific text.
    expect(html).toContain('Swagger UI');
  });

  it('sets no-cache for HTML and max-age for hashed assets', async () => {
    const htmlRes = await fetch(`${webServerUrl()}/index.html`);
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get('cache-control')).toMatch(/no-cache/);

    // Extract the first `<script src="…">` from index.html. Vite
    // fingerprints this filename, so we can't hardcode it.
    const match = (await htmlRes.text()).match(
      /<script[^>]+src=["']([^"']+)["']/i,
    );
    expect(match?.[1]).toBeDefined();

    const scriptSrc = match![1];

    // The bundle's index.html may reference assets as `/assets/…`
    // (absolute) or `./assets/…` (relative). Normalize to an absolute
    // path so the fetch URL composition works.
    const assetPath = scriptSrc.startsWith('http')
      ? new URL(scriptSrc).pathname
      : scriptSrc.startsWith('/')
        ? scriptSrc
        : `/${scriptSrc.replace(/^\.\//, '')}`;

    const assetRes = await fetch(`${webServerUrl()}${assetPath}`);
    expect(assetRes.status).toBe(200);
    expect(assetRes.headers.get('cache-control')).toMatch(/max-age=\d+/);
  });

  it('sets ETag on the SPA HTML response', async () => {
    const res = await fetch(`${webServerUrl()}/`);
    expect(res.headers.get('etag')).toBeDefined();
  });

  it('returns 404 for missing static files', async () => {
    const res = await fetch(
      `${webServerUrl()}/assets/non-existent-file-12345.js`,
    );
    expect(res.status).toBe(404);
  });

  it('handles concurrent requests without state corruption', async () => {
    const requests = Array.from({ length: 50 }, () =>
      fetch(`${webServerUrl()}/`, {
        headers: { Accept: 'text/html' },
      }),
    );
    const responses = await Promise.all(requests);
    const ok = responses.filter((r) => r.status === 200);
    expect(ok).toHaveLength(50);
  });
});
