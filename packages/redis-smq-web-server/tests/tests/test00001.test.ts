/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { config } from '../common/config.js';
import {
  shutdownWebServer,
  startWebServer,
} from '../common/start-web-server.js';

describe('RedisSMQWebServer E2E Tests', () => {
  const serverUrl = `http://localhost:${config.webServer?.port}`;

  it('should serve index.html for root path', async () => {
    await startWebServer();
    const response = await request(serverUrl)
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html/);

    expect(response.text).toContain('<!doctype html>');
  });

  it('should inject web UI config into index.html', async () => {
    await startWebServer();
    const response = await request(serverUrl).get('/').expect(200);
    expect(response.text).toContain('window.configs');
    expect(response.text).toContain('"BASE_PATH":"/"');
    expect(response.text).toContain('"API_URL":"/"');
  });

  it('should set cache headers for asset files', async () => {
    await startWebServer();
    const response = await request(serverUrl).get('/index.html').expect(200);

    // HTML should have no-cache
    expect(response.headers['cache-control']).toContain('no-cache');

    // Extract the first <script src="..."> from the HTML
    const match = response.text.match(/<script[^>]+src=["']([^"']+)["']/i);
    expect(
      match,
      'index.html should include at least one script tag with src',
    ).toBeTruthy();
    const scriptSrc = match?.[1] || '';
    expect(scriptSrc.length).toBeGreaterThan(0);

    // Ensure scriptSrc is an absolute path for supertest
    const assetPath = scriptSrc.startsWith('http')
      ? scriptSrc.replace(serverUrl, '')
      : scriptSrc;

    // Fetch the script asset and expect Cache-Control to be set (assets are cached)
    const assetRes = await request(serverUrl).get(assetPath).expect(200);
    expect(assetRes.headers['cache-control']).toBeDefined();
  });

  it('should return 404 for non-existent static files', async () => {
    await startWebServer();
    await request(serverUrl)
      .get('/assets/non-existent-file-12345.js')
      .expect(404);
  });

  it('should set ETag header for static files', async () => {
    await startWebServer();
    const response = await request(serverUrl).get('/').expect(200);

    expect(response.headers['etag']).toBeDefined();
  });

  it('should route /api requests to embedded REST API', async () => {
    await startWebServer();
    await request(serverUrl)
      .get('/api/v1/queues')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  it('should serve index.html for non-API routes', async () => {
    await startWebServer();
    const response = await request(serverUrl)
      .get('/queues/my-queue/messages/123/details')
      .expect(200)
      .expect('Content-Type', /text\/html/);

    expect(response.text).toContain('<!doctype html>');
  });

  it('should not serve index.html for /api routes', async () => {
    await startWebServer();
    const response = await request(serverUrl).get('/api/v1/queues');

    // Should not be HTML
    expect(response.headers['content-type']).not.toContain('text/html');
  });

  it('should not serve index.html for /docs routes', async () => {
    await startWebServer();
    const response = await request(serverUrl).get('/docs');
    expect(response.text).toContain('Swagger UI');
  });

  it('should include rate limit headers', async () => {
    await startWebServer();
    const response = await request(serverUrl).get('/');
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
  });

  it('should handle concurrent requests', async () => {
    await startWebServer();
    const requests = Array(50)
      .fill(null)
      .map(() => request(serverUrl).get('/'));

    const responses = await Promise.all(requests);
    const successfulResponses = responses.filter((r) => r.status === 200);

    expect(successfulResponses.length).toBe(50);
  });

  it('should shutdown gracefully', async () => {
    await startWebServer();
    await new Promise((resolve) => setTimeout(resolve, 500));

    let response = await request(serverUrl).get('/');
    expect(response.status).toBe(200);

    await shutdownWebServer();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Server should no longer respond
    try {
      response = await request(serverUrl).get('/');
      expect(response.status).not.toBe(200);
    } catch (err) {
      // Expected: connection refused
      expect(err).toBeDefined();
    }
  });
});
