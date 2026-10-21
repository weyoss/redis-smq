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
 * E2E tests for the `/api/namespaces/:ns/queues/:name/messages`
 * endpoints.
 */

const QUEUE = { ns: 'app', name: 'q1' };

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function createQueue(queue = QUEUE): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue,
      queueType: EQueueType.LIFO_QUEUE,
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    }),
  });
  expect(res.status).toBe(201);
}

async function publish(queue = QUEUE, body: string = 'hello'): Promise<string> {
  const res = await fetch(`${apiUrl()}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { body }, exchange: { queue } }),
  });
  expect(res.status).toBe(201);
  const { data } = (await res.json()) as { data: string[] };
  return data[0];
}

async function waitForCount(expected: number, queue = QUEUE): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${queue.ns}/queues/${queue.name}/messages/count`,
    );
    if (res.status === 200) {
      const { data } = (await res.json()) as { data: number };
      if (data >= expected) return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Count never reached ${expected}`);
}

// ─────────────────────────────────────────────────────────────────────
// GET …/messages
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages', () => {
  it('returns an empty browser page for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?page=1&pageSize=10`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: unknown[]; totalItems: number };
    };
    expect(data.items).toEqual([]);
    expect(data.totalItems).toBe(0);
  });

  it('returns pending messages after a publish', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?page=1&pageSize=10&status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: Array<{ id: string }>; totalItems: number };
    };
    expect(data.totalItems).toBe(1);
    expect(data.items).toHaveLength(1);
  });

  it('rejects a request without page parameters with 400 RequestValidationError', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages`,
    );
    expect(res.status).toBe(400);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('RequestValidationError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/messages/ids
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages/ids', () => {
  it('returns an empty page for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/ids?page=1&pageSize=10&status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: string[]; totalItems: number };
    };
    expect(data.items).toEqual([]);
    expect(data.totalItems).toBe(0);
  });

  it('returns message IDs, not full messages', async () => {
    await createQueue();
    const publishedId = await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/ids?page=1&pageSize=10&status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: string[]; totalItems: number };
    };
    expect(data.totalItems).toBe(1);
    expect(data.items).toEqual([publishedId]);
    // Each item is a string (the ID), not an object with an `id` field.
    expect(typeof data.items[0]).toBe('string');
  });

  it('accepts the same page and status query as GET …/messages', async () => {
    await createQueue();
    await publish();
    await publish();
    await waitForCount(2);

    const idsRes = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/ids?page=1&pageSize=1&status=pending`,
    );
    expect(idsRes.status).toBe(200);

    const { data } = (await idsRes.json()) as {
      data: { items: string[]; totalItems: number };
    };
    expect(data.items).toHaveLength(1);
    expect(data.totalItems).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/messages/count
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages/count', () => {
  it('returns 0 for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/count`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: number };
    expect(data).toBe(0);
  });

  it('returns the aggregate published count', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/count`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: number };
    expect(data).toBe(1);
  });

  it('returns a per-status map when groupBy=status', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/count?groupBy=status`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: Record<string, number> };
    expect(data.pending).toBe(1);
  });
});
