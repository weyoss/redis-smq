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
  EQueueType,
  type IPurgeQueueJob,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the `PurgeQueueWorker` background job.
 *
 * `QueuePublishedMessages.purge(queue)` does not empty the queue
 * synchronously. It schedules a background job and returns the job's
 * ID. A `PurgeQueueWorker` picks the job up on its next tick and
 * removes messages in fixed-size batches, updating the job's status
 * and a running `meta.purged` counter as it goes. The caller polls
 * `getPurgeJob(queue, jobId)` to track progress.
 *
 * This file covers the job's observable lifecycle: status transitions
 * and the intermediate purged-count checkpoints. The purge API's
 * user-facing contract — "the messages are gone" — is covered by the
 * `purge-*.test.ts` siblings.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Total messages produced before the purge.
 *
 * Chosen so the worker's 1000-message batches produce four distinct
 * checkpoints: 1000, 2000, 3000, 3007. See the file header.
 */
const TOTAL_MESSAGES = 3007;

/**
 * Number of produces issued in parallel per batch during setup.
 *
 * Issuing all 3007 produces concurrently would flood the Redis pool;
 * issuing them sequentially is slow. A chunk of 100 keeps the setup
 * time reasonable without stressing the pool.
 */
const PRODUCE_CHUNK_SIZE = 100;

/**
 * How long to wait between job-status polls.
 *
 * 500ms is short enough that the intermediate `meta.purged`
 * checkpoints (1000, 2000, 3000) are each observed at least once
 * before the worker advances past them. The original test used 1000ms
 * and observed all four; halving the interval adds margin.
 */
const POLL_INTERVAL_MS = 500;

/**
 * Hard deadline for the job to reach `COMPLETED`.
 *
 * The worker processes 3007 messages in four batches. On a quiet
 * machine that is a few seconds; on a loaded CI it can be tens of
 * seconds. 60 seconds is generous without being so large that a
 * wedged worker goes unnoticed.
 */
const JOB_COMPLETION_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce `count` messages to `queue` in chunks of `chunkSize`,
 * awaited between chunks.
 *
 * The producer is started once and shut down at the end. Chunked
 * parallelism keeps the total setup time bounded while avoiding the
 * pool contention that fully-concurrent produces would create.
 */
async function produceMany(
  queue: IQueueParams,
  count: number,
  chunkSize: number,
): Promise<void> {
  const producer = await startProducer();

  for (let offset = 0; offset < count; offset += chunkSize) {
    const chunkSizeActual = Math.min(chunkSize, count - offset);
    const produces: Promise<unknown>[] = [];
    for (let i = 0; i < chunkSizeActual; i += 1) {
      produces.push(
        producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody(`m${offset + i}`),
        ),
      );
    }
    await Promise.all(produces);
  }

  await producer.shutdown();
}

/**
 * Poll a purge job until it reaches `COMPLETED`, collecting every
 * observed snapshot.
 *
 * The snapshots are the primary evidence the test inspects: the
 * checkpoints in `meta.purged` are only visible if the polling catches
 * them, and the status transition to `COMPLETED` is only reliable if
 * the loop keeps polling until it sees that status.
 *
 * The loop is bounded by `deadline`. If the job never reaches
 * `COMPLETED`, the function throws with the last observed status and
 * purged count — enough context to distinguish "the worker is slow"
 * (large purged, non-completed) from "the worker never ran" (purged
 * zero, status unchanged).
 */
async function pollUntilComplete(
  queue: IQueueParams,
  jobId: string,
  deadline: number,
): Promise<IPurgeQueueJob[]> {
  const queueMessages = RedisSMQ.createQueuePublishedMessages();
  const snapshots: IPurgeQueueJob[] = [];

  while (Date.now() < deadline) {
    const job = await queueMessages.getPurgeJob(queue, jobId);
    snapshots.push(job);

    if (job.status === EBackgroundJobStatus.COMPLETED) return snapshots;

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  // The loop exhausted the deadline without seeing `COMPLETED`.
  const last = snapshots[snapshots.length - 1];
  throw new Error(
    `purge job ${jobId} did not reach COMPLETED within ` +
      `${JOB_COMPLETION_TIMEOUT_MS}ms. ` +
      `Last observed status=${EBackgroundJobStatus[last?.status ?? -1]}, ` +
      `purged=${last?.meta?.purged ?? 'unknown'}. ` +
      `Snapshots observed: ${snapshots.length}`,
  );
}

/**
 * Poll a purge job until it reaches `target`, with a bounded deadline.
 * Returns the final snapshot.
 *
 * Companion to `pollUntilComplete` for the cancel-race test, whose
 * terminal status is CANCELED, not COMPLETED. Throws if the job reaches
 * a *different* terminal status first (COMPLETED or FAILED) — that
 * would mean the job ran to a different conclusion than the test is
 * exercising, which is a setup failure rather than a code failure.
 */
async function pollUntilStatus(
  queue: IQueueParams,
  jobId: string,
  target: EBackgroundJobStatus,
  deadline: number,
): Promise<IPurgeQueueJob> {
  const queueMessages = RedisSMQ.createQueuePublishedMessages();
  let last: IPurgeQueueJob | undefined;

  while (Date.now() < deadline) {
    last = await queueMessages.getPurgeJob(queue, jobId);
    if (last.status === target) return last;

    // A job that reaches a *different* terminal state before `target`
    // means the race resolved in an unexpected direction. Fail with a
    // message naming both, rather than continuing to poll for a state
    // that will never arrive.
    if (
      last.status === EBackgroundJobStatus.COMPLETED ||
      last.status === EBackgroundJobStatus.FAILED
    ) {
      throw new Error(
        `purge job ${jobId} reached ${EBackgroundJobStatus[last.status]} ` +
          `before reaching target ${EBackgroundJobStatus[target]}. ` +
          `purged=${last.meta?.purged ?? 'unknown'}.`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `purge job ${jobId} did not reach ` +
      `${EBackgroundJobStatus[target]} within the deadline. ` +
      `Last observed status=${EBackgroundJobStatus[last?.status ?? -1]}, ` +
      `purged=${last?.meta?.purged ?? 'unknown'}.`,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PurgeQueueWorker', () => {
  it('processes a large purge in batches and reaches COMPLETED', async () => {
    const queue = uniqueQueue('purge-worker');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Produce 3007 messages in chunks. Sequential produce for all
    // 3007 would take a minute; fully-parallel would flood the pool.
    await produceMany(queue, TOTAL_MESSAGES, PRODUCE_CHUNK_SIZE);

    // Confirm the pre-state: exactly TOTAL_MESSAGES in pending. A
    // setup failure would otherwise make the post-purge zero
    // assertion pass whether or not the purge ran.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const before = await queueMessages.countMessages(queue);
    expect(before).toBe(TOTAL_MESSAGES);

    // Schedule the purge. The return value is the job ID.
    const jobId = await queueMessages.purge(queue);
    expect(typeof jobId).toBe('string');
    expect(jobId.length).toBeGreaterThan(0);

    // Poll until the job completes, collecting every snapshot.
    const deadline = Date.now() + JOB_COMPLETION_TIMEOUT_MS;
    const snapshots = await pollUntilComplete(queue, jobId, deadline);

    // The job reached COMPLETED. This is the terminal state of the
    // job; the loop returns only after seeing it.
    const last = snapshots[snapshots.length - 1];
    expect(last.status).toBe(EBackgroundJobStatus.COMPLETED);

    // The purged counter advances monotonically across snapshots. A
    // regression where the counter went backwards — a plausible bug
    // if the counter were reset per-batch rather than cumulative —
    // would fail here with the two values that violated the ordering.
    for (let i = 1; i < snapshots.length; i += 1) {
      const prev = snapshots[i - 1].meta?.purged ?? 0;
      const curr = snapshots[i].meta?.purged ?? 0;
      expect(
        curr,
        `snapshot ${i}: purged counter went backwards ` + `(${prev} → ${curr})`,
      ).toBeGreaterThanOrEqual(prev);
    }

    // The final snapshot's purged count matches the total. A
    // regression that stopped partway — say, after three batches —
    // would leave a smaller value here.
    expect(last.meta?.purged).toBe(TOTAL_MESSAGES);

    // The batch checkpoints were each observed at least once. These
    // are the observable evidence of the worker's 1000-message batch
    // size; a worker that processed messages one-at-a-time would never
    // produce them, and a worker that processed everything in one
    // batch would only produce the final checkpoint.
    //
    // The assertion is "at least one snapshot has this value", not
    // "the exact snapshot at index N has this value" — the polling
    // cadence determines which snapshots land on which checkpoints.
    for (const checkpoint of [1000, 2000, 3000, TOTAL_MESSAGES]) {
      expect(
        snapshots.some((s) => s.meta?.purged === checkpoint),
        `no snapshot observed purged=${checkpoint}. Observed purged ` +
          `values: [${snapshots
            .map((s) => s.meta?.purged)
            .filter((p): p is number => typeof p === 'number')
            .join(', ')}]`,
      ).toBe(true);
    }

    // The queue is empty after the purge. This is the user-visible
    // consequence; the intermediate snapshots are diagnostics for the
    // worker's behavior, but the caller's contract is "the queue is
    // clear".
    const after = await queueMessages.countMessages(queue);
    expect(after).toBe(0);

    // Every state bucket is zero, not just the total. A worker that
    // removed messages from the total count without clearing one of
    // the state lists would leave a discrepancy here.
    const countsAfter = await queueMessages.countMessagesByStatus(queue);
    expect(countsAfter).toEqual({
      pending: 0,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });
  });

  it('does not un-cancel a job when a progress update races a cancellation', async () => {
    // The invariant this test exists for: once a caller has cancelled
    // a purge job, the job's status must remain CANCELED even though
    // the worker may still be mid-batch and its next `updateProgress`
    // call may be in flight. Without `save-job-progress.lua`'s status
    // guard, `ManagerAbstract.update`'s read-modify-write would
    // clobber the CANCELED transition with the PROCESSING snapshot it
    // read.
    //
    // The race window is short, so this test exercises the *shape* of
    // the race (updates land after cancel) rather than timing the
    // exact read-then-write window. Without the guard, this test is
    // flaky-but-generally-failing; with the guard, it is
    // deterministic.
    const queue = uniqueQueue('purge-worker-cancel-race');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Enough messages to span several batches. A smaller set would
    // let the worker finish before the cancel could land, leaving no
    // post-cancel updates to race the guard. At 3007 messages with
    // 1000-message batches, several `updateProgress` calls happen
    // after the cancel.
    await produceMany(queue, TOTAL_MESSAGES, PRODUCE_CHUNK_SIZE);

    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const jobId = await queueMessages.purge(queue);

    // Wait until the worker has started the job. `start-job.lua`
    // transitions PENDING → PROCESSING before the first batch runs,
    // so seeing PROCESSING confirms the worker has begun and its
    // `updateProgress` calls will follow.
    await pollUntilStatus(
      queue,
      jobId,
      EBackgroundJobStatus.PROCESSING,
      Date.now() + JOB_COMPLETION_TIMEOUT_MS,
    );

    // Cancel. `cancel-job.lua` transitions PROCESSING → CANCELED
    // atomically. Once this resolves, the CANCELED status is
    // committed in Redis.
    await queueMessages.cancelPurge(queue, jobId);

    // Give the worker generous time to complete its in-flight batch.
    // Each batch calls `updateProgress` on the way out, and if the
    // guard were absent, one of those calls would `HSET` the job back
    // to PROCESSING with a stale snapshot — losing the cancel.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // The status must still be CANCELED. Any subsequent update from
    // the worker was rejected by the atomic guard, leaving the
    // committed CANCELED status intact.
    const finalJob = await queueMessages.getPurgeJob(queue, jobId);
    expect(finalJob.status).toBe(EBackgroundJobStatus.CANCELED);

    // The `meta.purged` value reflects whatever the worker purged up
    // to the last accepted update. The exact number is
    // non-deterministic (depends on cancel timing), but the range is
    // bounded — it must not have exceeded the total, and it must not
    // have been reset by the racing update path.
    expect(finalJob.meta.purged).toBeGreaterThanOrEqual(0);
    expect(finalJob.meta.purged).toBeLessThanOrEqual(TOTAL_MESSAGES);
  });
});
