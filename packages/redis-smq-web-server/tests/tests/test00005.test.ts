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
import request from 'supertest';

describe('CLI: respects custom basePath "/ui"', () => {
  let started: StartedProcess;

  beforeEach(async () => {
    started = await startCliWithArgs([
      '--base-path',
      '/ui',
      '--enable-log',
      '0',
    ]);
  });

  afterEach(async () => {
    await started.stop();
  });

  it('redirects "/" to "/ui"', async () => {
    const res = await request(started.url).get('/').expect(302);
    expect(res.headers.location).toBe('/ui');
  });

  it('serves index.html at "/ui" and SPA fallback under it', async () => {
    const res = await request(started.url).get('/ui/').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);

    const sub = await request(started.url).get('/ui/queues').expect(200);
    expect(sub.headers['content-type']).toMatch(/text\/html/);
  });

  it('serves api requests under custom basePath', async () => {
    await request(started.url)
      .get('/ui/api/queues')
      .expect((r) => {
        expect(r.headers['content-type']).not.toMatch(/text\/html/);
      });
  });
});
