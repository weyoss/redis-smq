/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startCliWithArgs, StartedProcess } from '../common/start-cli.js';
import {
  shutdownApiServer,
  startApiServer,
} from '../common/start-api-server.js';
import request from 'supertest';

describe('CLI: proxies API when apiProxyTarget is set', () => {
  let started: StartedProcess;

  beforeEach(async () => {
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

  afterEach(async () => {
    await started.stop();
    await shutdownApiServer();
  });

  it('proxies /api endpoints', async () => {
    await request(started.url)
      .get('/api/queues')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  it('proxies /swagger', async () => {
    const res = await request(started.url).get('/swagger').expect(200);
    expect(res.text).toMatch(/<html|<!doctype/i);
  });

  it('keeps SPA behavior for non-API routes', async () => {
    const res = await request(started.url).get('/about').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });
});
