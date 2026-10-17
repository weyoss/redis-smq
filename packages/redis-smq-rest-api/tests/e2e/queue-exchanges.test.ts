/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EExchangeQueuePolicy,
  EExchangeType,
  EQueueDeliveryModel,
  EQueueType,
  RedisSMQ,
} from 'redis-smq';
import { apiUrl } from '../helpers/context.js';

/**
 * E2E tests for `GET /api/namespaces/:ns/queues/:name/exchanges`.
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

async function createFanoutExchange(name: string): Promise<void> {
  await RedisSMQ.createFanoutExchange().create(
    { ns: NS, name },
    EExchangeQueuePolicy.STANDARD,
  );
}

async function bindQueue(exchange: string): Promise<void> {
  const res = await fetch(
    `${apiUrl()}/api/namespaces/${NS}/exchanges/${exchange}/bindings/${QUEUE}`,
    { method: 'POST' },
  );
  expect(res.status).toBe(204);
}

describe('GET …/exchanges', () => {
  it('returns 200 with an empty array for an unbound queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/exchanges`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: unknown[] };
    expect(data).toEqual([]);
  });

  it('returns the exchanges the queue is bound to', async () => {
    await createQueue();
    await createFanoutExchange('f1');
    await bindQueue('f1');

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/exchanges`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: Array<{ ns: string; name: string; type: EExchangeType }>;
    };
    expect(data).toEqual([{ ns: NS, name: 'f1', type: EExchangeType.FANOUT }]);
  });

  it('returns an empty array for an unknown queue', async () => {
    // The library's `getQueueExchanges` returns an empty list when
    // the queue isn't found. That's the behavior the endpoint
    // preserves — a "no such queue" query yields `[]`, not a 400.
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/missing/exchanges`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: unknown[] };
    expect(data).toEqual([]);
  });
});
