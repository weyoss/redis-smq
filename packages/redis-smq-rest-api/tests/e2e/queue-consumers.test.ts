/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueDeliveryModel, EQueueType, RedisSMQ } from 'redis-smq';
import type { ICallback } from 'redis-smq-common';
import { apiUrl } from '../helpers/context.js';

/**
 * E2E tests for `GET /api/namespaces/:ns/queues/:name/consumers`.
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
 * Polls the consumers endpoint until `consumerId` appears in the map,
 * or the attempt budget runs out.
 */
async function waitForConsumer(consumerId: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumers`,
    );
    if (res.status === 200) {
      const { data } = (await res.json()) as {
        data: Record<string, unknown>;
      };
      if (consumerId in data) return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Consumer ${consumerId} not visible after 2s`);
}

describe('GET …/consumers', () => {
  it('returns 200 with an empty object when no consumers are running', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumers`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: Record<string, unknown> };
    expect(data).toEqual({});
  });

  it('returns 200 with the running consumer', async () => {
    await createQueue();

    const consumer = await RedisSMQ.startConsumer();
    try {
      await consumer.consume(
        { ns: NS, name: QUEUE },
        (_msg, cb: ICallback<void>) => cb(),
      );
      const consumerId = consumer.getId();

      // Wait for the consumer's heartbeat to propagate to the index
      // the endpoint reads.
      await waitForConsumer(consumerId);

      const res = await fetch(
        `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumers`,
      );
      expect(res.status).toBe(200);

      const { data } = (await res.json()) as {
        data: Record<string, Record<string, unknown>>;
      };

      // The map contains exactly one entry — the consumer we started.
      expect(Object.keys(data)).toEqual([consumerId]);

      // Each entry is `{ pid, ipAddress, hostname, createdAt }`.
      const info = data[consumerId];
      expect(info).toBeDefined();
      expect(Object.keys(info ?? {}).sort()).toEqual(
        ['pid', 'ipAddress', 'hostname', 'createdAt'].sort(),
      );
    } finally {
      // Shutdown the consumer before the test ends. The API's
      // `shutdown()` in `afterEach` would dispose it too, but
      // disposing here keeps the cleanup local to the test that
      // started the resource.
      await consumer.shutdown();
    }
  });

  it('returns 400 QueueNotFoundError for an unknown queue', async () => {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/missing/consumers`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotFoundError');
  });
});
