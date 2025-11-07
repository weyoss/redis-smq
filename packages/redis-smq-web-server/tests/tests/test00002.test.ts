/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { startApiServer, stopApiServer } from '../common/start-api-server.js';
import { RedisSMQWebServer } from '../../index.js';
import { config } from '../common/config.js';
import { net } from 'redis-smq-common';
import path from 'path';

describe('RedisSMQWebServer with apiProxyTarget', () => {
  let webServerUrl: string;
  let webServer: RedisSMQWebServer;

  beforeEach(async () => {
    const apiPort = await startApiServer();
    const apiProxyTarget = `http://127.0.0.1:${apiPort}`;
    const webServerPort = await net.getRandomPort();
    webServer = new RedisSMQWebServer({
      ...config,
      webServer: {
        port: webServerPort,
        apiProxyTarget,
      },
    });
    await webServer.run();
    webServerUrl = `http://127.0.0.1:${webServerPort}`;
  });

  afterEach(async () => {
    await webServer.shutdown();
    await stopApiServer();
  });

  it('proxies /api/v1 endpoints', async () => {
    await request(webServerUrl)
      .get('/api/v1/queues')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  it('proxies /swagger', async () => {
    const res = await request(webServerUrl).get('/swagger').expect(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('serves SPA index.html for non-API routes', async () => {
    const res = await request(webServerUrl)
      .get('/queues/my-queue')
      .expect(200)
      .expect('Content-Type', /text\/html/);
    expect(res.text).toContain('<!doctype html>');
  });

  it('serves assets as static files', async () => {
    const res = await request(webServerUrl).get('/').expect(200);

    const match = res.text.match(/<script[^>]+src=["']([^"']+)["']/i);
    expect(match).toBeTruthy();
    const scriptSrc = match?.[1] || '';

    const assetPath = scriptSrc.startsWith('http')
      ? scriptSrc.replace(webServerUrl, '')
      : scriptSrc;

    const absolutePath = path.resolve('/', assetPath);
    const assetRes = await request(webServerUrl).get(absolutePath).expect(200);
    expect(assetRes.headers['cache-control']).toBeDefined();
  });
});
