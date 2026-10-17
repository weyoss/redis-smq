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

/**
 * E2E tests for `GET /api/exchanges`.
 *
 * The HTTP surface only exposes the read endpoint. Exchange creation
 * is not part of the REST API — the original package also omitted it.
 * Tests that need an exchange to exist create one via
 * `RedisSMQ.createXExchange()` directly, then assert the endpoint
 * reflects it.
 */

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
