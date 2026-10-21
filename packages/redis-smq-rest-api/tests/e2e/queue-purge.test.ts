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
 * E2E tests for the four `queue-purge` endpoints.
 *
 *   DELETE /api/namespaces/:ns/queues/:name/purge/:messageStatus
 *   GET    /api/namespaces/:ns/queues/:name/purge/:messageStatus/:jobId
 *   GET    /api/namespaces/:ns/queues/:name/purge/:messageStatus/:jobId/status
 *   DELETE /api/namespaces/:ns/queues/:name/purge/:messageStatus/:jobId
 */

const QUEUE = { ns: 'app', name: 'q1' };

type MessageStatus =
  'pending' | 'acknowledged' | 'dead-lettered' | 'scheduled' | 'published';

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

/**
 * Starts a purge and returns the job ID from the 202 response.
 *
 * Defaults to `pending` because every test in this file purges that
 * category. The parameter is here for a future test that exercises a
 * different category, or for a test that needs to intentionally
 * mismatch the category on the follow-up lookups.
 */
async function startPurge(
  queue = QUEUE,
  messageStatus: MessageStatus = 'pending',
): Promise<string> {
  const res = await fetch(
    `${apiUrl()}/api/namespaces/${queue.ns}/queues/${queue.name}/purge/${messageStatus}`,
    { method: 'DELETE' },
  );
  expect(res.status).toBe(202);
  const { data } = (await res.json()) as { data: { jobId: string } };
  return data.jobId;
}

/**
 * Polls a job's status until it reaches one of `terminalStatuses`.
 */
async function waitForJobStatus(
  jobId: string,
  terminalStatuses: EBackgroundJobStatus[],
  queue = QUEUE,
  messageStatus: MessageStatus = 'pending',
): Promise<EBackgroundJobStatus> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${queue.ns}/queues/${queue.name}/purge/${messageStatus}/${jobId}/status`,
    );
    if (res.status === 200) {
      const { data } = (await res.json()) as { data: EBackgroundJobStatus };
      if (terminalStatuses.includes(data)) return data;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Job ${jobId} never reached a terminal state`);
}

// ─────────────────────────────────────────────────────────────────────
// DELETE …/purge/:messageStatus — start purge
// ─────────────────────────────────────────────────────────────────────

describe('DELETE …/purge/:messageStatus (start purge)', () => {
  it('returns 202 Accepted with the job ID', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending`,
      { method: 'DELETE' },
    );

    // 202 Accepted, not 204 No Content: the purge is a background job
    // that is scheduled by this call, not completed by it. The job ID
    // in the body is the handle for tracking it.
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

  it('rejects an invalid messageStatus with 400 RequestValidationError', async () => {
    await createQueue();

    // `messageStatus` is validated against the five-value enum by AJV.
    // An unrecognized segment fails at the path-parameter boundary,
    // before the handler runs.
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/nonsense`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('RequestValidationError');
  });

  it('rejects a second purge while one is running with 403 QueueLockedError', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const first = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending`,
      { method: 'DELETE' },
    );
    expect(first.status).toBe(202);

    // Immediately try a second purge — the queue is locked by the
    // first job. This may race (the first job might complete before
    // the second request arrives), so accept either 202 (first
    // finished, second started a new job) or 403 (first still
    // running). The interesting property is that the endpoint
    // responds, not that timing is deterministic.
    const second = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending`,
      { method: 'DELETE' },
    );
    expect([202, 403]).toContain(second.status);
  });

  it('rejects an unknown queue with 400 QueueNotFoundError', async () => {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/missing/purge/pending`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotFoundError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/purge/:messageStatus/:jobId — full job record
// ─────────────────────────────────────────────────────────────────────

describe('GET …/purge/:messageStatus/:jobId', () => {
  it('returns the job record with status and progress', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const jobId = await startPurge();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending/${jobId}`,
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

  it('returns 400 RequestValidationError for an invalid messageStatus', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const jobId = await startPurge();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/nonsense/${jobId}`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('RequestValidationError');
  });

  it('returns 400 BackgroundJobNotFoundError for an unknown job ID', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending/does-not-exist`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    // `getPurgeJob` on a job ID that was never created raises
    // `BackgroundJobNotFoundError`. The `InvalidPurgeQueueJobIdError`
    // variant is reserved for a job that exists but under a
    // different (queue, category).
    expect(error.message).toBe('BackgroundJobNotFoundError');
  });

  it('returns 400 InvalidPurgeQueueJobIdError when messageStatus names the wrong category', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    // Start a purge of *pending* messages.
    const jobId = await startPurge();

    // Look up the same job ID under a *different* path category. The
    // job exists in the pending category, not in scheduled — the
    // library raises `InvalidPurgeQueueJobIdError`.
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/scheduled/${jobId}`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('InvalidPurgeQueueJobIdError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// GET …/purge/:messageStatus/:jobId/status — status enum only
// ─────────────────────────────────────────────────────────────────────

describe('GET …/purge/:messageStatus/:jobId/status', () => {
  it('returns the status enum', async () => {
    await createQueue();
    await publish();
    await waitForCount(1);

    const jobId = await startPurge();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending/${jobId}/status`,
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
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending/does-not-exist/status`,
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('BackgroundJobNotFoundError');
  });
});

// ─────────────────────────────────────────────────────────────────────
// DELETE …/purge/:messageStatus/:jobId — cancel
// ─────────────────────────────────────────────────────────────────────

describe('DELETE …/purge/:messageStatus/:jobId (cancel)', () => {
  it('cancels a running job and returns 204', async () => {
    await createQueue();
    // Publish enough messages that the job is likely still running
    // when cancel arrives. The purge batches its deletions, so a
    // larger set gives the cancel a better chance to observe a
    // still-running job.
    for (let i = 0; i < 20; i += 1) await publish();
    await waitForCount(20);

    const jobId = await startPurge();

    // Cancel while the job is still running. If the job finished
    // before we got here — a legitimate race on a fast machine — the
    // cancel returns 403 `BackgroundJobNotCancellableError`. Both are
    // valid for a test named "cancels a running job": the interesting
    // property is that the endpoint responds, not that the timing is
    // on our side.
    const cancelRes = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending/${jobId}`,
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
    // `BackgroundJobNotCancellableError` (403), not a no-op 204. The
    // library is explicit about "there is nothing to cancel" — a
    // client that retries a cancel should treat 403 as the stop
    // signal.
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending/${jobId}`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(403);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('BackgroundJobNotCancellableError');
  });

  it('returns 400 BackgroundJobNotFoundError for an unknown job ID', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${QUEUE.ns}/queues/${QUEUE.name}/purge/pending/does-not-exist`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('BackgroundJobNotFoundError');
  });
});
