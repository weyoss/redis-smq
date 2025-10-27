import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { startApiServer, stopApiServer } from '../common/start-api-server.js';
import { startCliWithArgs, StartedProcess } from '../common/start-cli.js';

describe('RedisSMQ Web Server CLI e2e tests', () => {
  describe('serves SPA with default basePath "/"', () => {
    let started: StartedProcess;

    beforeAll(async () => {
      started = await startCliWithArgs([
        '--base-path',
        '/',
        '--enable-log',
        '0',
      ]);
    });

    afterAll(async () => {
      await started.stop();
    });

    it('returns index.html for / and caches assets', async () => {
      const res = await request(started.url).get('/index.html').expect(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      // HTML should not be cached
      expect(res.headers['cache-control']).toMatch(/no-cache/);

      const match = res.text.match(/<script[^>]+src=["']([^"']+)["']/i);
      expect(match).toBeTruthy();
      const scriptSrc = match?.[1] ?? '';
      const assetPath = scriptSrc.startsWith('http')
        ? scriptSrc.replace(started.url, '')
        : scriptSrc;
      const assetRes = await request(started.url).get(assetPath).expect(200);
      expect(assetRes.headers['cache-control']).toBeDefined();
      expect(assetRes.headers['cache-control']).toMatch(/max-age=\d+/);
    });

    it('SPA fallback works on non-API route', async () => {
      const res = await request(started.url).get('/queues/demo').expect(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('respects custom basePath "/ui"', () => {
    let started: StartedProcess;

    beforeAll(async () => {
      started = await startCliWithArgs([
        '--base-path',
        '/ui',
        '--enable-log',
        '0',
      ]);
    });

    afterAll(async () => {
      await started.stop();
    });

    it('redirects "/" to "/ui"', async () => {
      const res = await request(started.url).get('/').expect(302);
      expect(res.headers.location).toBe('/ui');
    });

    it('serves index.html at "/ui" and SPA fallback under it', async () => {
      const res = await request(started.url).get('/ui').expect(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);

      const sub = await request(started.url).get('/ui/queues').expect(200);
      expect(sub.headers['content-type']).toMatch(/text\/html/);
    });

    it('serves api requests under custom basePath', async () => {
      await request(started.url)
        .get('/ui/api/v1/queues')
        .expect((r) => {
          expect(r.headers['content-type']).not.toMatch(/text\/html/);
        });
    });
  });

  describe('proxies API when apiProxyTarget is set', () => {
    let started: StartedProcess;

    beforeAll(async () => {
      const port = await startApiServer();
      started = await startCliWithArgs([
        '--base-path',
        '/',
        '--api-proxy-target',
        `http://127.0.0.1:${port}`,
        '--enable-log',
        '0',
      ]);
    });

    afterAll(async () => {
      await started.stop();
      await stopApiServer();
    });

    it('proxies /api/v1 endpoints', async () => {
      await request(started.url)
        .get('/api/v1/queues')
        .expect(200)
        .expect('Content-Type', /application\/json/);
    });

    it('proxies /docs', async () => {
      const res = await request(started.url).get('/docs').expect(200);
      expect(res.text).toMatch(/<html|<!doctype/i);
    });

    it('keeps SPA behavior for non-API routes', async () => {
      const res = await request(started.url).get('/about').expect(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });
  });
});
