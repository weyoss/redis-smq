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
 * E2E tests for `GET /api/namespaces` and `DELETE /api/namespaces/:ns`.
 *
 * Namespaces are created implicitly — a namespace exists as soon as a
 * queue or exchange is registered under it. The tests create queues
 * via `POST /api/queues` to establish a namespace, then verify the
 * list endpoint sees it and the delete endpoint removes it.
 *
 * Deleting a namespace requires its resources to be deletable. A
 * namespace with a queue that has pending messages, or with active
 * consumers, or with bound exchanges, is rejected. The tests focus on
 * the "empty namespace" and "namespace not found" cases — the others
 * are covered by the queue-delete tests and the library's own
 * validation.
 */

async function createQueue(ns: string, name: string): Promise<void> {
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

/**
 * Polls the namespace list until `name` is absent, or the attempt
 * budget runs out.
 *
 * Deleting a namespace involves cascading deletes across multiple
 * Redis keys; the removal from the namespace index may lag the 204
 * by a few dozen milliseconds. The poll absorbs that delay without
 * asserting a fixed wait.
 */
async function waitForNamespaceGone(name: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await fetch(`${apiUrl()}/api/namespaces`);
    if (res.status === 200) {
      const { data } = (await res.json()) as { data: string[] };
      if (!data.includes(name)) return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Namespace ${name} still present after 2s`);
}

describe('GET /api/namespaces', () => {
  it('returns 200 with an empty list when no resources exist', async () => {
    const res = await fetch(`${apiUrl()}/api/namespaces`);
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: string[] };
    expect(data).toEqual([]);
  });

  it('lists namespaces with queues', async () => {
    await createQueue('ns1', 'q1');
    await createQueue('ns2', 'q2');

    const res = await fetch(`${apiUrl()}/api/namespaces`);
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: string[] };
    expect([...data].sort()).toEqual(['ns1', 'ns2']);
  });

  it('lists the same namespace once even with multiple queues', async () => {
    await createQueue('ns1', 'q1');
    await createQueue('ns1', 'q2');
    await createQueue('ns1', 'q3');

    const res = await fetch(`${apiUrl()}/api/namespaces`);
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: string[] };
    expect(data).toEqual(['ns1']);
  });
});

describe('DELETE /api/namespaces/:ns', () => {
  it('deletes a namespace whose resources can be deleted', async () => {
    await createQueue('ns1', 'q1');
    await createQueue('ns2', 'q2');

    const res = await fetch(`${apiUrl()}/api/namespaces/ns1`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);

    await waitForNamespaceGone('ns1');

    const listRes = await fetch(`${apiUrl()}/api/namespaces`);
    const { data } = (await listRes.json()) as { data: string[] };
    expect(data).toEqual(['ns2']);
  });

  it('returns 400 NamespaceNotFoundError for an unknown namespace', async () => {
    const res = await fetch(`${apiUrl()}/api/namespaces/missing`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('NamespaceNotFoundError');
  });

  it('returns 400 InvalidNamespaceError for an invalid namespace name', async () => {
    // The library rejects names that don't match its naming rules.
    // `$$$` is not a valid namespace identifier — the handler reaches
    // `namespaceManager.delete()` and the library raises
    // `InvalidNamespaceError` before any deletion happens.
    const res = await fetch(`${apiUrl()}/api/namespaces/$$$`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('InvalidNamespaceError');
  });
});
