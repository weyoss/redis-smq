/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueDeliveryModel, EQueueType } from 'redis-smq';
import { apiUrl } from '../helpers/context.js';

/**
 * E2E tests for the three endpoints under
 * `/api/namespaces/:ns/queues/:name/rate-limit`.
 */

const NS = 'app';
const QUEUE = 'q1';

async function createQueue(): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue: { ns: NS, name: QUEUE },
      queueType: EQueueType.LIFO_QUEUE,
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    }),
  });
  expect(res.status).toBe(201);
}

/**
 * A valid rate limit.
 */
const VALID_RATE_LIMIT = { limit: 8, interval: 60_000 };

describe('GET …/rate-limit', () => {
  it('returns 200 with null for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: unknown };
    expect(data).toBeNull();
  });

  it('returns 400 QueueNotFoundError for an unknown queue', async () => {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/missing/rate-limit`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotFoundError');
  });
});

describe('PUT …/rate-limit', () => {
  it('sets a rate limit and returns the persisted value', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_RATE_LIMIT),
      },
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { limit: number; interval: number };
    };
    expect(data).toEqual(VALID_RATE_LIMIT);
  });

  it('is observable via a subsequent GET', async () => {
    await createQueue();
    await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_RATE_LIMIT),
    });

    const getRes = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`,
    );
    expect(getRes.status).toBe(200);

    const { data } = (await getRes.json()) as {
      data: { limit: number; interval: number };
    };
    expect(data).toEqual(VALID_RATE_LIMIT);
  });

  it('rejects an invalid limit with 400 InvalidRateLimitValueError', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 0, interval: VALID_RATE_LIMIT.interval }),
      },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('InvalidRateLimitValueError');
  });

  it('rejects a missing interval with 400 RequestValidationError', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 8 }),
      },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('RequestValidationError');
  });
});

describe('DELETE …/rate-limit', () => {
  it('clears a rate limit and returns 204', async () => {
    await createQueue();
    await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_RATE_LIMIT),
    });

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(204);

    const getRes = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/rate-limit`,
    );
    const { data } = (await getRes.json()) as { data: unknown };
    expect(data).toBeNull();
  });

  it('returns 400 QueueNotFoundError for an unknown queue', async () => {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/missing/rate-limit`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotFoundError');
  });
});
