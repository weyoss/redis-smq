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
  EMessagePropertyStatus,
  EQueueDeliveryModel,
  EQueueType,
} from 'redis-smq';
import { apiUrl } from '../helpers/context.js';
import { publishAndDeadLetter } from '../helpers/publish-and-dead-letter.js';

/**
 * E2E tests for the eight endpoints under `/api/messages`.
 *
 * Message publication is asynchronous on the RedisSMQ side: a 201
 * response from `POST /api/messages` means the producer accepted the
 * message, not that it's already indexed. Tests that read a message
 * back immediately after publishing call `waitForMessage` to poll
 * until the browse path sees it. The helper lives at the top of this
 * file rather than in `tests/helpers/` because nothing outside this
 * file needs the delay.
 */

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
 * budget runs out. RedisSMQ indexes messages asynchronously; a
 * publish followed immediately by a read can 404 for a few
 * milliseconds.
 */
async function waitForMessage(id: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await fetch(`${apiUrl()}/api/messages/${id}`);
    if (res.status === 200) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Message ${id} not indexed after 1s`);
}

describe('POST /api/messages', () => {
  it('publishes to a queue and returns 201 with the produced ids', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const ids = await publish({ ns: 'app', name: 'q1' });
    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toHaveLength(1);
    expect(typeof ids[0]).toBe('string');
  });

  it('rejects a body with no exchange target with 400', async () => {
    const res = await fetch(`${apiUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { body: 'x' }, exchange: {} }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
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

describe('GET /api/messages/:id', () => {
  it('returns the message after it is indexed', async () => {
    await createQueue({ ns: 'app', name: 'q1' });
    const [id] = await publish({ ns: 'app', name: 'q1' });
    await waitForMessage(id);

    const res = await fetch(`${apiUrl()}/api/messages/${id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; status: number } };
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

describe('POST /api/messages/:id (requeue)', () => {
  it('requeues a dead-lettered message via the canonical path', async () => {
    const queue = { ns: 'app', name: 'q1' };
    await createQueue(queue);

    const [id] = await publishAndDeadLetter(queue);

    const res = await fetch(`${apiUrl()}/api/messages/${id}`, {
      method: 'POST',
    });
    expect(res.status).toBe(204);
  });

  it('requeues a dead-lettered message via the alias path', async () => {
    const queue = { ns: 'app', name: 'q1' };
    await createQueue(queue);

    const [id] = await publishAndDeadLetter(queue);

    const res = await fetch(`${apiUrl()}/api/messages/${id}/requeue`, {
      method: 'POST',
    });
    expect(res.status).toBe(204);
  });

  it('rejects a pending message with 412 MessageNotRequeuableError', async () => {
    // A freshly-published message is PENDING, not DEAD_LETTERED.
    // `requeueMessageById` only accepts dead-lettered messages, so
    // this case produces a 412 rather than a 204. The test is worth
    // keeping: it documents the difference between the two states and
    // catches a regression where the handler might stop discriminating
    // between them.
    const queue = { ns: 'app', name: 'q1' };
    await createQueue(queue);

    const [id] = await publish(queue);
    await waitForMessage(id);

    const res = await fetch(`${apiUrl()}/api/messages/${id}`, {
      method: 'POST',
    });
    expect(res.status).toBe(412);

    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('MessageNotRequeuableError');
  });
});

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
