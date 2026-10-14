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
 * `/api/namespaces/:ns/queues/:name/messages`.
 *
 * ## Why polling for readiness
 *
 * A 201 from `POST /api/messages` means the producer accepted the
 * message, not that it's been indexed by the browse endpoint. RedisSMQ
 * processes the publish → index transition asynchronously. Tests that
 * publish and then read immediately poll the count endpoint until the
 * count reflects the publish. The poll has a bounded attempt budget
 * so a genuine failure surfaces as a thrown error, not a hang.
 */

const QUEUE = { ns: 'app', name: 'q1' };

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

/**
 * Polls the count endpoint until it equals `expected` or the attempt
 * budget runs out.
 *
 * RedisSMQ's purge is asynchronous: a 204 from `DELETE …/messages`
 * means the library accepted the request, not that the browse path
 * already reflects the removal. Tests that purge and then assert on
 * the count must wait for the pipeline to catch up. Bounded so a
 * genuine failure surfaces as a thrown error rather than a hang.
 */
async function waitForCountExact(
  expected: number,
  queue = QUEUE,
): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${queue.ns}/queues/${queue.name}/messages/count`,
    );
    if (res.status === 200) {
      const { data } = (await res.json()) as { data: number };
      if (data === expected) return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Count never reached ${expected}`);
}

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

    const { data } = (await res.json()) as {
      data: Record<string, number>;
    };
    // The map includes only statuses with a non-zero count. A fresh
    // queue with one pending message produces `{ pending: 1 }`.
    expect(data.pending).toBe(1);
  });
});

describe('DELETE …/messages', () => {
  it('purges pending messages and returns 204', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?status=pending`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(204);

    // The purge endpoint accepted the request. RedisSMQ processes the
    // removal asynchronously; poll until the browse path sees zero.
    await waitForCountExact(0);
  });
});
