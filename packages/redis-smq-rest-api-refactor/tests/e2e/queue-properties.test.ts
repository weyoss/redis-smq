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
 * E2E tests for `GET`, `DELETE`, and `HEAD` on
 * `/api/namespaces/:ns/queues/:name`.
 *
 * The three endpoints share a path and differ only by method. Grouping
 * them in one file mirrors that: a change to the path or the queue
 * parameter affects all three, and a reviewer reading the file sees
 * every operation the resource supports.
 */

const NS = 'app';
const NAME = 'q1';

async function createQueue(ns = NS, name = NAME): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue: { ns, name },
      queueType: EQueueType.LIFO_QUEUE,
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    }),
  });
  expect(res.status).toBe(201);
}

describe('GET /api/namespaces/:ns/queues/:name', () => {
  it('returns 200 with the queue properties', async () => {
    await createQueue();

    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${NAME}`);
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: {
        queueType: EQueueType;
        deliveryModel: EQueueDeliveryModel;
        messagesCount: number;
      };
    };
    expect(data.queueType).toBe(EQueueType.LIFO_QUEUE);
    expect(data.deliveryModel).toBe(EQueueDeliveryModel.POINT_TO_POINT);
    expect(data.messagesCount).toBe(0);
  });

  it('returns 400 QueueNotFoundError for an unknown queue', async () => {
    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/missing`);
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotFoundError');
  });
});

describe('HEAD /api/namespaces/:ns/queues/:name', () => {
  it('returns 200 for an existing queue', async () => {
    await createQueue();

    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${NAME}`, {
      method: 'HEAD',
    });
    expect(res.status).toBe(200);
  });

  it('returns 400 for an unknown queue', async () => {
    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/missing`, {
      method: 'HEAD',
    });
    expect(res.status).toBe(400);
  });

  it('sends no body with the response', async () => {
    await createQueue();

    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${NAME}`, {
      method: 'HEAD',
    });
    const text = await res.text();
    expect(text).toBe('');
  });
});

describe('DELETE /api/namespaces/:ns/queues/:name', () => {
  it('deletes the queue and returns 204', async () => {
    await createQueue();

    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${NAME}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    // A subsequent HEAD confirms the deletion propagated. If the
    // library's delete is async on the write side, this poll absorbs
    // the delay; if the delete is synchronous, it resolves on the
    // first attempt.
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const check = await fetch(
        `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}`,
        { method: 'HEAD' },
      );
      if (check.status === 400) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Queue ${NAME} still present after 2s`);
  });

  it('returns 400 QueueNotFoundError for an unknown queue', async () => {
    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/missing`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotFoundError');
  });
});
