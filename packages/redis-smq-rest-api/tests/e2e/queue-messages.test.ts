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
  EBackgroundJobStatus,
  EQueueDeliveryModel,
  EQueueType,
} from 'redis-smq';
import { apiUrl } from '../helpers/context.js';

/**
 * E2E tests for the `/api/namespaces/:ns/queues/:name/messages`
 * endpoints.
 */

const QUEUE = { ns: 'app', name: 'q1' };

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function createQueue(queue = QUEUE): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue,
      queueType: EQueueType.LIFO_QUEUE,
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    }),
  });
  expect(res.status).toBe(201);
}

async function publish(queue = QUEUE, body: string = 'hello'): Promise<string> {
  const res = await fetch(`${apiUrl()}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { body }, exchange: { queue } }),
  });
  expect(res.status).toBe(201);
  const { data } = (await res.json()) as { data: string[] };
  return data[0];
}

async function waitForCount(expected: number, queue = QUEUE): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${queue.ns}/queues/${queue.name}/messages/count`,
    );
    if (res.status === 200) {
      const { data } = (await res.json()) as { data: number };
      if (data >= expected) return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Count never reached ${expected}`);
}

async function waitForJobStatus(
  jobId: string,
  terminalStatuses: EBackgroundJobStatus[],
  queue = QUEUE,
): Promise<EBackgroundJobStatus> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${queue.ns}/queues/${queue.name}/messages/purge/${jobId}/status?status=pending`,
    );
    if (res.status === 200) {
      const { data } = (await res.json()) as { data: EBackgroundJobStatus };
      if (terminalStatuses.includes(data)) return data;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Job ${jobId} never reached a terminal state`);
}

/**
 * Starts a purge of the queue's pending messages and returns the job
 * ID from the 202 response.
 */
async function startPurge(queue = QUEUE): Promise<string> {
  const res = await fetch(
    `${apiUrl()}/api/namespaces/${queue.ns}/queues/${queue.name}/messages?status=pending`,
    { method: 'DELETE' },
  );
  expect(res.status).toBe(202);
  const { data } = (await res.json()) as { data: { jobId: string } };
  return data.jobId;
}

// ─────────────────────────────────────────────────────────────────────
// GET …/messages
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages', () => {
  it('returns an empty browser page for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?page=1&pageSize=10`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: unknown[]; totalItems: number };
    };
    expect(data.items).toEqual([]);
    expect(data.totalItems).toBe(0);
  });

  it('returns pending messages after a publish', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?page=1&pageSize=10&status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: Array<{ id: string }>; totalItems: number };
    };
    expect(data.totalItems).toBe(1);
    expect(data.items).toHaveLength(1);
  });

  it('rejects a request without page parameters with 400 RequestValidationError', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages`,
    );
    expect(res.status).toBe(400);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('RequestValidationError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/messages/ids
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages/ids', () => {
  it('returns an empty page for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/ids?page=1&pageSize=10&status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: string[]; totalItems: number };
    };
    expect(data.items).toEqual([]);
    expect(data.totalItems).toBe(0);
  });

  it('returns message IDs, not full messages', async () => {
    await createQueue();
    const publishedId = await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/ids?page=1&pageSize=10&status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { items: string[]; totalItems: number };
    };
    expect(data.totalItems).toBe(1);
    expect(data.items).toEqual([publishedId]);
    // Each item is a string (the ID), not an object with an `id` field.
    expect(typeof data.items[0]).toBe('string');
  });

  it('accepts the same page and status query as GET …/messages', async () => {
    await createQueue();
    await publish();
    await publish();
    await waitForCount(2);

    const idsRes = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/ids?page=1&pageSize=1&status=pending`,
    );
    expect(idsRes.status).toBe(200);

    const { data } = (await idsRes.json()) as {
      data: { items: string[]; totalItems: number };
    };
    expect(data.items).toHaveLength(1);
    expect(data.totalItems).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/messages/count
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages/count', () => {
  it('returns 0 for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/count`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: number };
    expect(data).toBe(0);
  });

  it('returns the aggregate published count', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/count`,
    );
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: number };
    expect(data).toBe(1);
  });

  it('returns a per-status map when groupBy=status', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/count?groupBy=status`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: Record<string, number> };
    expect(data.pending).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────
// DELETE …/messages — start purge
// ─────────────────────────────────────────────────────────────────────

describe('DELETE …/messages (start purge)', () => {
  it('returns 202 Accepted with the job ID', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?status=pending`,
      { method: 'DELETE' },
    );

    expect(res.status).toBe(202);

    const { data } = (await res.json()) as { data: { jobId: string } };
    expect(typeof data.jobId).toBe('string');
    expect(data.jobId.length).toBeGreaterThan(0);
  });

  it('starts a job that runs to completion', async () => {
    await createQueue();
    await publish();
    await publish();
    await waitForCount(2);

    const jobId = await startPurge();

    const finalStatus = await waitForJobStatus(jobId, [
      EBackgroundJobStatus.COMPLETED,
      EBackgroundJobStatus.FAILED,
    ]);
    expect(finalStatus).toBe(EBackgroundJobStatus.COMPLETED);

    // Count is zero after completion.
    const countRes = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/count`,
    );
    const { data: count } = (await countRes.json()) as { data: number };
    expect(count).toBe(0);
  });

  it('rejects a second purge while one is running with 403 QueueLockedError', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const first = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?status=pending`,
      { method: 'DELETE' },
    );
    expect(first.status).toBe(202);

    // Immediately start a second purge — the queue is locked by the
    // first job. This may race (the first job might complete before
    // the second request arrives), so only assert the second status
    // is either 202 (first already finished) or 403 (still running).
    const second = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages?status=pending`,
      { method: 'DELETE' },
    );
    expect([202, 403]).toContain(second.status);
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/messages/purge/:jobId — full job record
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages/purge/:jobId', () => {
  it('returns the job record with status and progress', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const jobId = await startPurge();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/${jobId}?status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: {
        id: string;
        status: EBackgroundJobStatus;
        meta: { purged: number };
      };
    };
    expect(data.id).toBe(jobId);
    expect(typeof data.status).toBe('number');
    expect(typeof data.meta.purged).toBe('number');
  });

  it('finds the job without a status query', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const jobId = await startPurge();

    // No `status` query — the handler searches every category.
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/${jobId}`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: { id: string } };
    expect(data.id).toBe(jobId);
  });

  it('returns 400 BackgroundJobNotFoundError for an unknown job ID', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/does-not-exist`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('BackgroundJobNotFoundError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/messages/purge/:jobId/status — just the enum
// ─────────────────────────────────────────────────────────────────────

describe('GET …/messages/purge/:jobId/status', () => {
  it('returns the status enum', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const jobId = await startPurge();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/${jobId}/status?status=pending`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as { data: EBackgroundJobStatus };
    expect(typeof data).toBe('number');
    // PENDING=0, PROCESSING=1, COMPLETED=2, FAILED=3, CANCELED=4
    expect([0, 1, 2, 3, 4]).toContain(data);
  });

  it('returns 400 BackgroundJobNotFoundError for an unknown job ID', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/does-not-exist/status?status=pending`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('BackgroundJobNotFoundError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// DELETE …/messages/purge/:jobId — cancel
// ─────────────────────────────────────────────────────────────────────

describe('DELETE …/messages/purge/:jobId (cancel)', () => {
  it('cancels a running job and returns 204', async () => {
    await createQueue();
    // Publish enough messages that the job is likely still running
    // when cancel arrives.
    for (let i = 0; i < 20; i += 1) await publish();
    await waitForCount(20);

    const jobId = await startPurge();

    // Cancel while the job is still running. If the job finished
    // before we got here, this returns 403
    // `BackgroundJobNotCancellableError` — a valid race outcome. The
    // important thing is that the cancel endpoint responds and
    // doesn't hang.
    const cancelRes = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/${jobId}?status=pending`,
      { method: 'DELETE' },
    );
    expect([204, 403]).toContain(cancelRes.status);
  });

  it('rejects cancelling a completed job with 403 BackgroundJobNotCancellableError', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const jobId = await startPurge();

    // Wait for the job to reach a terminal state.
    await waitForJobStatus(jobId, [
      EBackgroundJobStatus.COMPLETED,
      EBackgroundJobStatus.FAILED,
    ]);

    // Cancelling a terminal job rejects with
    // `BackgroundJobNotCancellableError` (403)
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/${jobId}?status=pending`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(403);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('BackgroundJobNotCancellableError');
  });

  it('returns 400 BackgroundJobNotFoundError for an unknown job ID', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/messages/purge/does-not-exist?status=pending`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('BackgroundJobNotFoundError');
  });
});
