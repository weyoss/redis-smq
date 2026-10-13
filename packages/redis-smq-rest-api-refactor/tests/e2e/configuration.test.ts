/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { apiUrl } from '../helpers/context.js';

/**
 * E2E tests for `GET /api/config` and `PATCH /api/config`.
 *
 * Every request goes through the real HTTP stack — router, body
 * parser, AJV validation, the handler, the envelope, and (on failure)
 * the error handler. Nothing is stubbed. The setup file runs Redis
 * and the API for the whole file; `beforeEach` flushes Redis and
 * re-applies the library config between tests.
 */

describe('GET /api/config', () => {
  it('returns 200 with the parsed library config', async () => {
    const res = await fetch(`${apiUrl()}/api/config`);

    expect(res.status).toBe(200);

    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).toHaveProperty('namespace');
    expect(body.data).toHaveProperty('logger');
    expect(body.data).toHaveProperty('messageAudit');
  });

  it('wraps the config in the `{ data }` envelope', async () => {
    const res = await fetch(`${apiUrl()}/api/config`);
    const body = (await res.json()) as Record<string, unknown>;

    // Exactly one top-level key. A bare config object here would mean
    // the router forgot to apply the envelope; a second key would mean
    // something else leaked into the response.
    expect(Object.keys(body)).toEqual(['data']);
  });

  it('sets Content-Type to application/json', async () => {
    const res = await fetch(`${apiUrl()}/api/config`);
    expect(res.headers.get('content-type')).toMatch(/^application\/json/);
  });
});

describe('PATCH /api/config', () => {
  it('applies a valid patch and returns the updated config', async () => {
    const res = await fetch(`${apiUrl()}/api/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageAudit: true }),
    });

    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: {
        messageAudit: {
          acknowledgedMessages: { enabled: boolean };
          deadLetteredMessages: { enabled: boolean };
          unacknowledgementHistory: { enabled: boolean };
        };
      };
    };

    expect(body.data.messageAudit.acknowledgedMessages.enabled).toBe(true);
    expect(body.data.messageAudit.deadLetteredMessages.enabled).toBe(true);
    expect(body.data.messageAudit.unacknowledgementHistory.enabled).toBe(true);
  });

  it('is observable via a subsequent GET', async () => {
    // The round-trip property: what a PATCH writes, a GET reads back.
    // This is the reason the configuration endpoints exist as a pair,
    // and the reason they share a test file rather than each having
    // its own. A bug that made PATCH write to the wrong key, or GET
    // read from the wrong key, would pass every single-endpoint test
    // and fail this one.
    const patchRes = await fetch(`${apiUrl()}/api/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageAudit: true }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { data: unknown };

    const getRes = await fetch(`${apiUrl()}/api/config`);
    expect(getRes.status).toBe(200);
    const read = (await getRes.json()) as { data: unknown };

    expect(read.data).toEqual(patched.data);
  });

  it('rejects a malformed body with 400 RequestValidationError', async () => {
    // `messageAudit` is `boolean | IMessageAuditConfig` in the DTO.
    // A string is neither. AJV rejects before the handler runs.
    const res = await fetch(`${apiUrl()}/api/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageAudit: 'not-a-boolean' }),
    });

    expect(res.status).toBe(400);

    const body = (await res.json()) as {
      error: { code: number; message: string; details?: unknown[] };
    };
    expect(body.error.code).toBe(400);
    expect(body.error.message).toBe('RequestValidationError');
    expect(Array.isArray(body.error.details)).toBe(true);
    expect((body.error.details ?? []).length).toBeGreaterThan(0);
  });

  it('accepts an empty patch as a no-op', async () => {
    // Capture the current config, apply an empty patch, verify the
    // response reflects no change. This is the strongest assertion
    // available for the empty-patch case: status alone would pass even
    // if the handler accidentally reset the config to defaults.
    const beforeRes = await fetch(`${apiUrl()}/api/config`);
    expect(beforeRes.status).toBe(200);
    const before = (await beforeRes.json()) as { data: unknown };

    const patchRes = await fetch(`${apiUrl()}/api/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { data: unknown };

    expect(patched.data).toEqual(before.data);
  });

  it('rejects an unknown top-level field with 400', async () => {
    // The request DTO is `IRedisSMQConfig`, which does not admit
    // arbitrary keys. The generated schema sets
    // `additionalProperties: false`, so AJV rejects this before the
    // handler sees it. If the schema ever stopped enforcing that,
    // this test would fail — which is the point.
    const res = await fetch(`${apiUrl()}/api/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notARealConfigField: true }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });
});
