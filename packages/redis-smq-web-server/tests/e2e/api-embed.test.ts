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
 * E2E tests for the embedded REST API path.
 */

describe('embedded REST API routing', () => {
  it('GET /api/queues returns JSON from the embedded API', async () => {
    const res = await fetch(`${webServerUrl()}/api/queues`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);

    const body = (await res.json()) as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/config returns the running library config', async () => {
    const res = await fetch(`${webServerUrl()}/api/config`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { namespace: string };
    };
    expect(typeof body.data.namespace).toBe('string');
  });

  it('POST /api/queues creates a queue and returns 201', async () => {
    const res = await fetch(`${webServerUrl()}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue: { ns: 'test', name: 'q1' },
        queueType: 0, // EQueueType.LIFO_QUEUE
        queueDeliveryModel: 0, // EQueueDeliveryModel.POINT_TO_POINT
      }),
    });

    expect(res.status).toBe(201);
  });

  it('GET /swagger serves the Swagger UI HTML', async () => {
    const res = await fetch(`${webServerUrl()}/swagger`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(await res.text()).toContain('Swagger UI');
  });

  it('GET /swagger/assets/openapi-specs.json returns the spec', async () => {
    const res = await fetch(
      `${webServerUrl()}/swagger/assets/openapi-specs.json`,
    );

    expect(res.status).toBe(200);
    const spec = (await res.json()) as { openapi: string };
    expect(spec.openapi).toBe('3.1.0');
  });

  it('proxies POST bodies without buffering', async () => {
    // The web server does not install `express.json()`. If it did, the
    // body would be consumed by the parser and the embedded API would
    // see an empty request. This test creates a queue (which requires
    // a body) and verifies the API received it.
    const res = await fetch(`${webServerUrl()}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue: { ns: 'body-test', name: 'q1' },
        queueType: 0,
        queueDeliveryModel: 0,
      }),
    });
    expect(res.status).toBe(201);

    const listRes = await fetch(`${webServerUrl()}/api/queues`);
    const list = (await listRes.json()) as {
      data: Array<{ ns: string; name: string }>;
    };
    const found = list.data.find(
      (q) => q.ns === 'body-test' && q.name === 'q1',
    );
    expect(found).toBeDefined();
  });
});
