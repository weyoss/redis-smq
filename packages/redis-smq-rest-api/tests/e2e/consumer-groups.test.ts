import { describe, expect, it } from 'vitest';
import { EQueueDeliveryModel, EQueueType } from 'redis-smq';
import { apiUrl } from '../helpers/context.js';

/**
 * E2E tests for the six endpoints under
 * `/api/namespaces/:ns/queues/:name/consumer-groups`.
 *
 * Consumer groups require a queue with `PUB_SUB` delivery model.
 * Requests against a `POINT_TO_POINT` queue produce
 * `ConsumerGroupsNotSupportedError` (422) — tested once to prove the
 * boundary.
 *
 * Pending messages are per-group, so a queue with two groups and two
 * published messages produces two pending messages per group (pub/sub
 * fans out). The count test relies on that.
 */

const NS = 'app';
const QUEUE = 'q1';
const GROUP_A = 'group-a';
const GROUP_B = 'group-b';

async function createPubSubQueue(): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue: { ns: NS, name: QUEUE },
      queueType: EQueueType.LIFO_QUEUE,
      queueDeliveryModel: EQueueDeliveryModel.PUB_SUB,
    }),
  });
  expect(res.status).toBe(201);
}

async function createPointToPointQueue(): Promise<void> {
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

async function saveGroup(group: string): Promise<void> {
  const res = await fetch(
    `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumerGroupId: group }),
    },
  );
  expect(res.status).toBe(204);
}

async function publish(): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: { body: 'hello' },
      exchange: { queue: { ns: NS, name: QUEUE } },
    }),
  });
  expect(res.status).toBe(201);
}

async function waitForGroupCount(
  group: string,
  expected: number,
): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups/${group}/messages/count`,
    );
    if (res.status === 200) {
      const { data } = (await res.json()) as { data: number };
      if (data >= expected) return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Group ${group} count never reached ${expected}`);
}

describe('GET …/consumer-groups', () => {
  it('returns 200 with an empty list for a fresh queue', async () => {
    await createPubSubQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: string[] };
    expect(data).toEqual([]);
  });

  it('lists saved groups', async () => {
    await createPubSubQueue();
    await saveGroup(GROUP_A);
    await saveGroup(GROUP_B);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: string[] };
    expect([...data].sort()).toEqual([GROUP_A, GROUP_B]);
  });
});

describe('POST …/consumer-groups', () => {
  it('saves a group and returns 204', async () => {
    await createPubSubQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumerGroupId: GROUP_A }),
      },
    );
    expect(res.status).toBe(204);
  });

  it('returns 422 ConsumerGroupsNotSupportedError on a point-to-point queue', async () => {
    await createPointToPointQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumerGroupId: GROUP_A }),
      },
    );
    expect(res.status).toBe(422);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('ConsumerGroupsNotSupportedError');
  });

  it('rejects a missing consumerGroupId with 400 RequestValidationError', async () => {
    await createPubSubQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    expect(res.status).toBe(400);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('RequestValidationError');
  });
});

describe('DELETE …/consumer-groups/:consumerGroupId', () => {
  it('deletes the group and returns 204', async () => {
    await createPubSubQueue();
    await saveGroup(GROUP_A);
    await saveGroup(GROUP_B);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups/${GROUP_A}`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(204);

    const listRes = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups`,
    );
    const { data } = (await listRes.json()) as { data: string[] };
    expect(data).toEqual([GROUP_B]);
  });
});

describe('GET …/consumer-groups/:consumerGroupId/messages', () => {
  it('returns pending messages for the group', async () => {
    await createPubSubQueue();
    await saveGroup(GROUP_A);
    await publish();
    await waitForGroupCount(GROUP_A, 1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups/${GROUP_A}/messages?page=1&pageSize=10`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: unknown[]; totalItems: number };
    };
    expect(data.totalItems).toBe(1);
    expect(data.items).toHaveLength(1);
  });
});

describe('GET …/consumer-groups/:consumerGroupId/messages/count', () => {
  it('returns the pending count for the group', async () => {
    await createPubSubQueue();
    await saveGroup(GROUP_A);
    await saveGroup(GROUP_B);
    await publish();
    await waitForGroupCount(GROUP_A, 1);
    await waitForGroupCount(GROUP_B, 1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups/${GROUP_A}/messages/count`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: number };
    expect(data).toBe(1);
  });
});

describe('DELETE …/consumer-groups/:consumerGroupId/messages', () => {
  it('purges pending messages for the group', async () => {
    await createPubSubQueue();
    await saveGroup(GROUP_A);
    await publish();
    await waitForGroupCount(GROUP_A, 1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups/${GROUP_A}/messages`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(204);

    // Poll for the purge to propagate.
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const countRes = await fetch(
        `${apiUrl()}/api/namespaces/${NS}/queues/${QUEUE}/consumer-groups/${GROUP_A}/messages/count`,
      );
      const { data } = (await countRes.json()) as { data: number };
      if (data === 0) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('Purge did not propagate to count endpoint');
  });
});
