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
  EMessagePropertyStatus,
  EQueueDeliveryModel,
  EQueueType,
} from 'redis-smq';
import { apiUrl } from '../helpers/context.js';
import { publishAndDeadLetter } from '../helpers/publish-and-dead-letter.js';

/**
 * E2E tests for the `/api/messages` endpoints.
 */

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function createQueue(body: {
  ns: string;
  name: string;
  queueType?: EQueueType;
  queueDeliveryModel?: EQueueDeliveryModel;
}): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue: { ns: body.ns, name: body.name },
      queueType: body.queueType ?? EQueueType.LIFO_QUEUE,
      queueDeliveryModel:
        body.queueDeliveryModel ?? EQueueDeliveryModel.POINT_TO_POINT,
    }),
  });
  expect(res.status).toBe(201);
}

async function createExchange(
  exchange: { ns: string; name: string },
  type: EExchangeType,
): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/exchanges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exchange,
      type,
      queuePolicy: EExchangeQueuePolicy.STANDARD,
    }),
  });
  expect(res.status).toBe(201);
}

async function bindQueueToExchange(
  queue: { ns: string; name: string },
  exchange: { ns: string; name: string },
  type: EExchangeType,
  binding: string,
): Promise<void> {
  const query =
    type === EExchangeType.DIRECT
      ? `routingKey=${encodeURIComponent(binding)}`
      : type === EExchangeType.TOPIC
        ? `routingPattern=${encodeURIComponent(binding)}`
        : '';
  const url =
    `${apiUrl()}/api/namespaces/${exchange.ns}/exchanges/${exchange.name}/bindings/${queue.name}` +
    (query ? `?${query}` : '');
  const res = await fetch(url, { method: 'POST' });
  expect(res.status).toBe(204);
}

/**
 * Publishes to a queue directly and returns the produced message IDs.
 *
 * Used by every test whose destination is `{ exchange: { queue } }`
 * — the simplest path, and the one the remaining tests share as
 * setup.
 */
async function publish(queue: { ns: string; name: string }): Promise<string[]> {
  const res = await fetch(`${apiUrl()}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: { body: 'hello' },
      exchange: { queue },
    }),
  });
  expect(res.status).toBe(201);
  const body = (await res.json()) as { data: string[] };
  return body.data;
}

/**
 * Polls `GET /api/messages/:id` until it returns 200 or the attempt
 * budget runs out.
 *
 * RedisSMQ indexes messages asynchronously; a publish followed
 * immediately by a read can 404 for a few dozen milliseconds.
 */
async function waitForMessage(id: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await fetch(`${apiUrl()}/api/messages/${id}`);
    if (res.status === 200) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Message ${id} not indexed after 1s`);
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/messages — publish to queue
// ─────────────────────────────────────────────────────────────────────

describe('POST /api/messages — publish to queue', () => {
  it('publishes to a queue and returns 201 with the produced ids', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const ids = await publish({ ns: 'app', name: 'q1' });
    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toHaveLength(1);
    expect(typeof ids[0]).toBe('string');
  });

  it('rejects a body with no exchange target with 400 MessageExchangeRequiredError', async () => {
    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { body: 'x' }, exchange: {} }),
    });
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: { message: string } };
    // The DTO marks `queue`, `topic`, `fanOut`, and `direct` as
    // required within their respective branches. An empty `exchange`
    // matches no branch; AJV rejects it before the handler runs.
    expect(body.error.message).toBe('RequestValidationError');
  });

  it('rejects a body with two exchange targets with 400', async () => {
    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { body: 'x' },
        exchange: {
          queue: { ns: 'a', name: 'b' },
          topic: { ns: 'a', name: 'c' },
        },
      }),
    });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/messages — publish to direct exchange
// ─────────────────────────────────────────────────────────────────────

describe('POST /api/messages — publish to direct exchange', () => {
  it('publishes with a routing key and returns 201', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    await createExchange({ ns: 'app', name: 'dir' }, EExchangeType.DIRECT);
    await bindQueueToExchange(
      { ns: 'app', name: 'q1' },
      { ns: 'app', name: 'dir' },
      EExchangeType.DIRECT,
      'alpha',
    );

    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { body: 'hello' },
        exchange: {
          direct: { ns: 'app', name: 'dir' },
          routingKey: 'alpha',
        },
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: string[] };
    expect(body.data).toHaveLength(1);
    expect(typeof body.data[0]).toBe('string');
  });

  it('rejects a direct publish without a routing key with 400 RequestValidationError', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    await createExchange({ ns: 'app', name: 'dir' }, EExchangeType.DIRECT);

    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { body: 'hello' },
        exchange: { direct: { ns: 'app', name: 'dir' } },
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/messages — publish to topic exchange
// ─────────────────────────────────────────────────────────────────────

describe('POST /api/messages — publish to topic exchange', () => {
  it('publishes with a routing key and returns 201', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    await createExchange({ ns: 'app', name: 'top' }, EExchangeType.TOPIC);
    await bindQueueToExchange(
      { ns: 'app', name: 'q1' },
      { ns: 'app', name: 'top' },
      EExchangeType.TOPIC,
      'order.*',
    );

    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { body: 'hello' },
        exchange: {
          topic: { ns: 'app', name: 'top' },
          routingKey: 'order.created',
        },
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: string[] };
    expect(body.data).toHaveLength(1);
  });

  it('rejects a topic publish without a routing key with 400 RequestValidationError', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    await createExchange({ ns: 'app', name: 'top' }, EExchangeType.TOPIC);

    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { body: 'hello' },
        exchange: { topic: { ns: 'app', name: 'top' } },
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/messages — routing key arity
// ─────────────────────────────────────────────────────────────────────

describe('POST /api/messages — routing key arity', () => {
  it('rejects a routing key on a fanout destination with 400', async () => {
    // The `fanOut` branch marks `routingKey` as `?: never`. The
    // generated schema forbids the field on that branch; sending it
    // fails validation before the handler runs.
    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { body: 'hello' },
        exchange: {
          fanOut: { ns: 'app', name: 'some-fanout' },
          routingKey: 'ignored',
        },
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });

  it('rejects a routing key on a queue destination with 400', async () => {
    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { body: 'hello' },
        exchange: {
          queue: { ns: 'app', name: 'q1' },
          routingKey: 'ignored',
        },
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/messages/:id
// ─────────────────────────────────────────────────────────────────────

describe('GET /api/messages/:id', () => {
  it('returns the message after it is indexed', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [id] = await publish({ ns: 'app', name: 'q1' });
    await waitForMessage(id);

    const res = await fetch(`${apiUrl()}/api/messages/${id}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: { id: string; status: number };
    };
    expect(body.data.id).toBe(id);
    expect(body.data.status).toBe(EMessagePropertyStatus.PENDING);
  });

  it('returns 400 MessageNotFoundError for an unknown id', async () => {
    const res = await fetch(
      `${apiUrl()}/api/messages/00000000-0000-0000-0000-000000000000`,
    );
    expect(res.status).toBe(400);

    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('MessageNotFoundError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/messages?ids=…
// ─────────────────────────────────────────────────────────────────────

describe('GET /api/messages?ids=…', () => {
  it('returns every requested message', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [a] = await publish({ ns: 'app', name: 'q1' });
    const [b] = await publish({ ns: 'app', name: 'q1' });
    await waitForMessage(a);
    await waitForMessage(b);

    const params = new URLSearchParams();
    params.append('ids', a);
    params.append('ids', b);
    const res = await fetch(`${apiUrl()}/api/messages?${params}`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string }> };
    expect(body.data.map((m) => m.id).sort()).toEqual([a, b].sort());
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/messages/:id/status
// ─────────────────────────────────────────────────────────────────────

describe('GET /api/messages/:id/status', () => {
  it('returns the current message status', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [id] = await publish({ ns: 'app', name: 'q1' });
    await waitForMessage(id);

    const res = await fetch(`${apiUrl()}/api/messages/${id}/status`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { data: number };
    expect(body.data).toBe(EMessagePropertyStatus.PENDING);
  });
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/messages/:id — requeue
// ─────────────────────────────────────────────────────────────────────

describe('POST /api/messages/:id — requeue', () => {
  it('requeues a dead-lettered message via the canonical path', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [id] = await publishAndDeadLetter({ ns: 'app', name: 'q1' });

    const res = await fetch(`${apiUrl()}/api/messages/${id}`, {
      method: 'POST',
    });
    expect(res.status).toBe(204);
  });

  it('requeues a dead-lettered message via the alias path', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [id] = await publishAndDeadLetter({ ns: 'app', name: 'q1' });

    const res = await fetch(`${apiUrl()}/api/messages/${id}/requeue`, {
      method: 'POST',
    });
    expect(res.status).toBe(204);
  });

  it('rejects a pending message with 412 MessageNotRequeuableError', async () => {
    // A freshly-published message is PENDING, not DEAD_LETTERED.
    // `requeueMessageById` only accepts dead-lettered messages, so
    // this case produces a 412 rather than a 204.
    await createQueue({ ns: 'app', name: 'q1' });
    const [id] = await publish({ ns: 'app', name: 'q1' });
    await waitForMessage(id);

    const res = await fetch(`${apiUrl()}/api/messages/${id}`, {
      method: 'POST',
    });
    expect(res.status).toBe(412);

    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('MessageNotRequeuableError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/messages/:id
// ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/messages/:id', () => {
  it('deletes a message and returns 204', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [id] = await publish({ ns: 'app', name: 'q1' });
    await waitForMessage(id);

    const res = await fetch(`${apiUrl()}/api/messages/${id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });
});

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/messages?ids=…
// ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/messages?ids=…', () => {
  it('deletes every requested message', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [a] = await publish({ ns: 'app', name: 'q1' });
    const [b] = await publish({ ns: 'app', name: 'q1' });
    await waitForMessage(a);
    await waitForMessage(b);

    const params = new URLSearchParams();
    params.append('ids', a);
    params.append('ids', b);
    const res = await fetch(`${apiUrl()}/api/messages?${params}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });
});
