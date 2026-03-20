/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { startCliWithArgs, StartedProcess } from '../common/start-cli.js';
import path from 'path';

describe('CLI: serves SPA with default basePath "/"', () => {
  let started: StartedProcess;

  beforeEach(async () => {
    started = await startCliWithArgs(['--base-path', '/', '--enable-log', '0']);
  });

  afterEach(async () => {
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
    const absolutePath = path.resolve('/', assetPath);
    const assetRes = await request(started.url).get(absolutePath).expect(200);
    expect(assetRes.headers['cache-control']).toBeDefined();
    expect(assetRes.headers['cache-control']).toMatch(/max-age=\d+/);
  });

  it('SPA fallback works on non-API route', async () => {
    const res = await request(started.url).get('/queues/demo').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });
});
