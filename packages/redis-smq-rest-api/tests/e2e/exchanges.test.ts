/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EExchangeQueuePolicy, EExchangeType, RedisSMQ } from 'redis-smq';
import { apiUrl } from '../helpers/context.js';

// ─────────────────────────────────────────────────────────────────────
// Existing GET tests (unchanged) — kept for context
// ─────────────────────────────────────────────────────────────────────

describe('GET /api/exchanges', () => {
  it('returns 200 with an empty list when no exchanges exist', async () => {
    const res = await fetch(`${apiUrl()}/api/exchanges`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it('returns every exchange with its type', async () => {
    const direct = { ns: 'ns1', name: 'e-direct' };
    const fanout = { ns: 'ns2', name: 'e-fanout' };
    const topic = { ns: 'ns3', name: 'e-topic' };

    await RedisSMQ.createDirectExchange().create(
      direct,
      EExchangeQueuePolicy.STANDARD,
    );
    await RedisSMQ.createFanoutExchange().create(
      fanout,
      EExchangeQueuePolicy.STANDARD,
    );
    await RedisSMQ.createTopicExchange().create(
      topic,
      EExchangeQueuePolicy.STANDARD,
    );

    const res = await fetch(`${apiUrl()}/api/exchanges`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: Array<{ ns: string; name: string; type: EExchangeType }>;
    };

    const sorted = [...body.data].sort((a, b) =>
      `${a.ns}/${a.name}`.localeCompare(`${b.ns}/${b.name}`),
    );

    expect(sorted).toEqual([
      { ...direct, type: EExchangeType.DIRECT },
      { ...fanout, type: EExchangeType.FANOUT },
      { ...topic, type: EExchangeType.TOPIC },
    ]);
  });

  it('wraps the list in the `{ data }` envelope', async () => {
    const res = await fetch(`${apiUrl()}/api/exchanges`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(['data']);
  });
});

// ─────────────────────────────────────────────────────────────────────
// New POST tests
// ─────────────────────────────────────────────────────────────────────

describe('POST /api/exchanges', () => {
  it('creates a fanout exchange and returns 201 with its properties', async () => {
    const res = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'events' },
        type: EExchangeType.FANOUT,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });

    expect(res.status).toBe(201);

    const body = (await res.json()) as {
      data: {
        exchange: { ns: string; name: string };
        properties: { type: EExchangeType; queuePolicy: EExchangeQueuePolicy };
      };
    };

    expect(body.data.exchange).toEqual({ ns: 'app', name: 'events' });
    expect(body.data.properties.type).toBe(EExchangeType.FANOUT);
    expect(body.data.properties.queuePolicy).toBe(
      EExchangeQueuePolicy.STANDARD,
    );
  });

  it('creates a direct and a topic exchange', async () => {
    const directRes = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'orders' },
        type: EExchangeType.DIRECT,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });
    expect(directRes.status).toBe(201);
    const direct = (await directRes.json()) as {
      data: { properties: { type: EExchangeType } };
    };
    expect(direct.data.properties.type).toBe(EExchangeType.DIRECT);

    const topicRes = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'events' },
        type: EExchangeType.TOPIC,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });
    expect(topicRes.status).toBe(201);
    const topic = (await topicRes.json()) as {
      data: { properties: { type: EExchangeType } };
    };
    expect(topic.data.properties.type).toBe(EExchangeType.TOPIC);
  });

  it('creates a PRIORITY-policy exchange', async () => {
    const res = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'priority-exchange' },
        type: EExchangeType.DIRECT,
        queuePolicy: EExchangeQueuePolicy.PRIORITY,
      }),
    });
    expect(res.status).toBe(201);

    const body = (await res.json()) as {
      data: { properties: { queuePolicy: EExchangeQueuePolicy } };
    };
    expect(body.data.properties.queuePolicy).toBe(
      EExchangeQueuePolicy.PRIORITY,
    );
  });

  it('is observable via a subsequent GET', async () => {
    const createRes = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'observable' },
        type: EExchangeType.TOPIC,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await fetch(`${apiUrl()}/api/exchanges`);
    const list = (await listRes.json()) as {
      data: Array<{ ns: string; name: string; type: EExchangeType }>;
    };
    const found = list.data.find(
      (e) => e.ns === 'app' && e.name === 'observable',
    );
    expect(found).toBeDefined();
    expect(found?.type).toBe(EExchangeType.TOPIC);
  });

  it('rejects a duplicate exchange with 409 ExchangeAlreadyExistsError', async () => {
    const body = JSON.stringify({
      exchange: { ns: 'app', name: 'duplicate' },
      type: EExchangeType.DIRECT,
      queuePolicy: EExchangeQueuePolicy.STANDARD,
    });

    const first = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(first.status).toBe(201);

    const second = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(second.status).toBe(409);

    const err = (await second.json()) as {
      error: { code: number; message: string };
    };
    expect(err.error.code).toBe(409);
    expect(err.error.message).toBe('ExchangeAlreadyExistsError');
  });

  it('rejects a duplicate exchange with a different type with 409', async () => {
    // The library fixes the type at creation; a second create with a
    // different type is still a duplicate, not a reconfiguration.
    await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'fixed-type' },
        type: EExchangeType.DIRECT,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });

    const res = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'fixed-type' },
        type: EExchangeType.TOPIC,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });
    expect(res.status).toBe(409);
  });

  it('rejects a missing exchange object with 400 RequestValidationError', async () => {
    const res = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: EExchangeType.DIRECT,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });

  it('rejects an out-of-range type with 400 RequestValidationError', async () => {
    // `EExchangeType` is a numeric enum. The generated schema
    // constrains `type` to its members; an integer outside the set
    // fails AJV before the handler runs.
    const res = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: 'app', name: 'bad-type' },
        type: 999,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('RequestValidationError');
  });

  it('rejects an invalid exchange name with 400 InvalidExchangeParametersError', async () => {
    // Character validation is a library rule, not a schema rule — the
    // DTO type is `string` and admits any string. The handler reaches
    // `exchangeManager.create`, which raises
    // `InvalidExchangeParametersError` for names that violate the
    // naming rules.
    const res = await fetch(`${apiUrl()}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange: { ns: '@@@', name: '$$$' },
        type: EExchangeType.DIRECT,
        queuePolicy: EExchangeQueuePolicy.STANDARD,
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: number; message: string };
    };
    expect(body.error.code).toBe(400);
    expect(body.error.message).toBe('InvalidExchangeParametersError');
  });
});
