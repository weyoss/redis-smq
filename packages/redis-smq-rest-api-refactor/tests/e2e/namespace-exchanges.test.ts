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
 * E2E tests for the nine endpoints under
 * `/api/namespaces/:ns/exchanges`.
 *
 * Exchange creation is not part of the REST API — the original
 * package also omitted it. Tests that need an exchange to exist
 * create one via `RedisSMQ.createXExchange()` directly, then assert
 * the endpoint reflects it.
 */

const NS = 'app';

async function createQueue(name: string): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue: { ns: NS, name },
      queueType: EQueueType.LIFO_QUEUE,
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    }),
  });
  expect(res.status).toBe(201);
}

async function createDirect(name: string): Promise<void> {
  await RedisSMQ.createDirectExchange().create(
    { ns: NS, name },
    EExchangeQueuePolicy.STANDARD,
  );
}

async function createFanout(name: string): Promise<void> {
  await RedisSMQ.createFanoutExchange().create(
    { ns: NS, name },
    EExchangeQueuePolicy.STANDARD,
  );
}

async function createTopic(name: string): Promise<void> {
  await RedisSMQ.createTopicExchange().create(
    { ns: NS, name },
    EExchangeQueuePolicy.STANDARD,
  );
}

describe('GET /api/namespaces/:ns/exchanges', () => {
  it('returns 200 with an empty list for a fresh namespace', async () => {
    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/exchanges`);
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: unknown[] };
    expect(data).toEqual([]);
  });

  it('lists every exchange in the namespace', async () => {
    await createDirect('d1');
    await createFanout('f1');
    await createTopic('t1');

    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/exchanges`);
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as {
      data: Array<{ name: string; type: EExchangeType }>;
    };

    const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
    expect(sorted.map((e) => e.name)).toEqual(['d1', 'f1', 't1']);
    expect(sorted.map((e) => e.type)).toEqual([
      EExchangeType.DIRECT,
      EExchangeType.FANOUT,
      EExchangeType.TOPIC,
    ]);
  });
});

describe('GET /api/namespaces/:ns/exchanges/:exchange', () => {
  it('returns 200 with the exchange', async () => {
    await createDirect('d1');

    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/exchanges/d1`);
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as {
      data: { ns: string; name: string; type: EExchangeType };
    };
    expect(data).toEqual({
      ns: NS,
      name: 'd1',
      type: EExchangeType.DIRECT,
    });
  });

  it('returns 400 ExchangeNotFoundError for an unknown exchange', async () => {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/missing`,
    );
    expect(res.status).toBe(400);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('ExchangeNotFoundError');
  });
});

describe('DELETE /api/namespaces/:ns/exchanges/:exchange', () => {
  it('deletes the exchange and returns 204', async () => {
    await createDirect('d1');

    const res = await fetch(`${apiUrl()}/api/namespaces/${NS}/exchanges/d1`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    const after = await fetch(`${apiUrl()}/api/namespaces/${NS}/exchanges/d1`);
    expect(after.status).toBe(400);
  });

  it('returns 400 ExchangeNotFoundError for an unknown exchange', async () => {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/missing`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(400);
  });
});

describe('GET …/exchanges/:exchange/match', () => {
  it('returns 200 with the queues matching a fanout exchange', async () => {
    await createQueue('q1');
    await createFanout('f1');
    await fetch(`${apiUrl()}/api/namespaces/${NS}/exchanges/f1/bindings/q1`, {
      method: 'POST',
    }).then((r) => expect(r.status).toBe(204));

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/f1/match`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as {
      data: Array<{ ns: string; name: string }>;
    };
    expect(data).toEqual([{ ns: NS, name: 'q1' }]);
  });
});

describe('GET …/exchanges/:exchange/routing-keys', () => {
  it('returns 200 with routing keys for a direct exchange', async () => {
    await createQueue('q1');
    await createDirect('d1');
    await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/d1/bindings/q1?routingKey=alpha`,
      { method: 'POST' },
    ).then((r) => expect(r.status).toBe(204));

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/d1/routing-keys`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: string[] };
    expect(data).toContain('alpha');
  });

  it('returns 400 InvalidDirectExchangeParametersError for a fanout exchange', async () => {
    await createFanout('f1');

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/f1/routing-keys`,
    );
    expect(res.status).toBe(400);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('InvalidDirectExchangeParametersError');
  });
});

describe('GET …/exchanges/:exchange/routing-patterns', () => {
  it('returns 200 with routing patterns for a topic exchange', async () => {
    await createQueue('q1');
    await createTopic('t1');
    await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/t1/bindings/q1?routingPattern=foo.*`,
      { method: 'POST' },
    ).then((r) => expect(r.status).toBe(204));

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/t1/routing-patterns`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: string[] };
    expect(data).toContain('foo.*');
  });

  it('returns 400 InvalidTopicExchangeParamsError for a fanout exchange', async () => {
    await createFanout('f1');

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/f1/routing-patterns`,
    );
    expect(res.status).toBe(400);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('InvalidTopicExchangeParamsError');
  });
});

describe('GET …/exchanges/:exchange/bindings', () => {
  it('returns 200 with a map of routing keys to queues for a direct exchange', async () => {
    await createQueue('q1');
    await createQueue('q2');
    await createDirect('d1');
    await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/d1/bindings/q1?routingKey=alpha`,
      { method: 'POST' },
    );
    await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/d1/bindings/q2?routingKey=beta`,
      { method: 'POST' },
    );

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/d1/bindings`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as {
      data: Record<string, Array<{ name: string }>>;
    };
    expect(Object.keys(data).sort()).toEqual(['alpha', 'beta']);
    expect(data.alpha?.[0]?.name).toBe('q1');
    expect(data.beta?.[0]?.name).toBe('q2');
  });
});

describe('POST …/exchanges/:exchange/bindings/:queue', () => {
  it('binds a queue to a fanout exchange', async () => {
    await createQueue('q1');
    await createFanout('f1');

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/f1/bindings/q1`,
      { method: 'POST' },
    );
    expect(res.status).toBe(204);
  });

  it('binds a queue to a direct exchange with a routing key', async () => {
    await createQueue('q1');
    await createDirect('d1');

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/d1/bindings/q1?routingKey=alpha`,
      { method: 'POST' },
    );
    expect(res.status).toBe(204);
  });
});

describe('DELETE …/exchanges/:exchange/bindings/:queue', () => {
  it('unbinds a queue and returns 204', async () => {
    await createQueue('q1');
    await createFanout('f1');
    await fetch(`${apiUrl()}/api/namespaces/${NS}/exchanges/f1/bindings/q1`, {
      method: 'POST',
    });

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/f1/bindings/q1`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(204);
  });

  it('returns 412 QueueNotBoundError for an unbound queue', async () => {
    await createQueue('q1');
    await createFanout('f1');

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/exchanges/f1/bindings/q1`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(412);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotBoundError');
  });
});
