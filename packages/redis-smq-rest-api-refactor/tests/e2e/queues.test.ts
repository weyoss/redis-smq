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
 * E2E tests for `GET /api/queues` and `POST /api/queues`.
 *
 * `beforeEach` in the setup file flushes Redis between tests, so each
 * `it` starts from an empty queue registry unless it creates its own.
 * That's what makes the "empty list" assertion in the first test
 * meaningful rather than dependent on test order.
 */

const VALID_QUEUE_BODY = {
  queue: { ns: 'my-app', name: 'my-queue' },
  queueType: EQueueType.LIFO_QUEUE,
  queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
};

describe('GET /api/queues', () => {
  it('returns 200 with an empty list when no queues exist', async () => {
    const res = await fetch(`${apiUrl()}/api/queues`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it('returns queues created via POST', async () => {
    // Create two queues, then list. Verifies the write path and the
    // read path agree — the same cross-endpoint consistency property
    // the configuration tests assert for GET/PATCH.
    const first = { ns: 'ns1', name: 'q1' };
    const second = { ns: 'ns2', name: 'q2' };

    for (const queue of [first, second]) {
      const res = await fetch(`${apiUrl()}/api/queues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...VALID_QUEUE_BODY, queue }),
      });
      expect(res.status).toBe(201);
    }

    const listRes = await fetch(`${apiUrl()}/api/queues`);
    expect(listRes.status).toBe(200);

    const list = (await listRes.json()) as {
      data: Array<{ ns: string; name: string }>;
    };
    const sorted = [...list.data].sort((a, b) =>
      `${a.ns}/${a.name}`.localeCompare(`${b.ns}/${b.name}`),
    );
    expect(sorted).toEqual([first, second]);
  });
});

describe('POST /api/queues', () => {
  it('creates a queue and returns 201 with its properties', async () => {
    const res = await fetch(`${apiUrl()}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_QUEUE_BODY),
    });

    expect(res.status).toBe(201);

    const body = (await res.json()) as {
      data: {
        queue: { ns: string; name: string };
        properties: Record<string, unknown>;
      };
    };

    expect(body.data.queue).toEqual(VALID_QUEUE_BODY.queue);
    expect(body.data.properties).toMatchObject({
      queueType: EQueueType.LIFO_QUEUE,
      deliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
      messagesCount: 0,
    });
  });

  it('rejects a duplicate queue with 409 QueueAlreadyExistsError', async () => {
    const create = () =>
      fetch(`${apiUrl()}/api/queues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_QUEUE_BODY),
      });

    const first = await create();
    expect(first.status).toBe(201);

    const second = await create();
    expect(second.status).toBe(409);

    const body = (await second.json()) as {
      error: { code: number; message: string };
    };
    expect(body.error.code).toBe(409);
    expect(body.error.message).toBe('QueueAlreadyExistsError');
  });

  it('rejects a missing queue object with 400 RequestValidationError', async () => {
    const res = await fetch(`${apiUrl()}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueType: EQueueType.LIFO_QUEUE,
        queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { message: string; details?: unknown[] };
    };
    expect(body.error.message).toBe('RequestValidationError');
    expect(Array.isArray(body.error.details)).toBe(true);
  });

  it('rejects an unknown queueType with 400 RequestValidationError', async () => {
    // `EQueueType` is a numeric enum; the generated schema constrains
    // the field to its values. Any number outside the enum fails at
    // validation, before the handler reaches redis-smq.
    const res = await fetch(`${apiUrl()}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_QUEUE_BODY, queueType: 99_999 }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });

  it('rejects a queue name with invalid characters with 400 InvalidQueueParametersError', async () => {
    // Character validation is a redis-smq rule, not a schema rule —
    // the DTO type is `string` and admits any string. The handler
    // reaches `queueManager.save`, which raises
    // `InvalidQueueParametersError` for names that violate the
    // library's naming rules. This test proves the error path from
    // handler to HTTP response works.
    const res = await fetch(`${apiUrl()}/api/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...VALID_QUEUE_BODY,
        queue: { ns: '$$$', name: '@@@' },
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: number; message: string };
    };
    expect(body.error.code).toBe(400);
    expect(body.error.message).toBe('InvalidQueueParametersError');
  });
});
