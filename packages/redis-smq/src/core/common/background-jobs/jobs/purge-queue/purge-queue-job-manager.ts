/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ManagerAbstract } from '../../manager-abstract.js';
import { async, ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { keys as redisKeys } from '../../../redis/keys/keys.js';
import {
  TPurgeQueueJob,
  TPurgeQueueJobMeta,
  TPurgeQueueJobPayload,
} from './types/index.js';
import { EBackgroundJobStatus } from '../../types/index.js';
import { randomUUID } from 'node:crypto';
import { BackgroundJobNotFoundError } from '../../../../errors/index.js';
import { _lockQueue } from '../../../../queue-state-manager/_/_lock-queue.js';
import { _unlockQueue } from '../../../../queue-state-manager/_/_unlock-queue.js';
import { IQueueParams } from '../../../../../contracts/index.js';
import {
  EQueueStateLockOwner,
  ESystemStateTransitionReason,
} from '../../../../../contracts/index.js';

export class PurgeQueueJobManager extends ManagerAbstract<
  TPurgeQueueJobPayload,
  TPurgeQueueJobMeta
> {
  /**
   * Progress reporting granularity, as a percentage. A value of 10
   * reports at every 10% milestone (11 reports including 0% and 100%);
   * 20 reports at every 20% (6 reports); 25 at every 25% (5 reports),
   * and so on.
   *
   * The value must divide 100 evenly so the final bucket lands exactly
   * on 100%. Values that do not are rejected by `setProgressReportPercent`.
   */
  protected static readonly DEFAULT_PROGRESS_REPORT_PERCENT = 10;

  protected progressReportPercent =
    PurgeQueueJobManager.DEFAULT_PROGRESS_REPORT_PERCENT;

  /**
   * Last reported bucket (0..bucketCount) per in-flight purge job. Used
   * by `updateProgress` to report at progress milestones instead of on
   * an arbitrary divisibility condition. Entries are cleared when the
   * job reaches a terminal state so a long-lived process does not leak
   * one entry per purge.
   *
   * "Bucket" rather than "decile" because the reporting step is
   * configurable: with `progressReportPercent = 20`, there are 5 buckets,
   * not 10.
   */
  private readonly reportedBucket = new Map<string, number>();

  constructor(redisClient: IRedisClient, logger: ILogger) {
    const keys = redisKeys.getMainKeys();
    super(
      redisClient,
      {
        keyBackgroundJobs: keys.keyPurgeJobs,
        keyBackgroundJobsPending: keys.keyPurgeJobsPending,
        keyBackgroundJobsProcessing: keys.keyPurgeJobsProcessing,
      },
      logger,
    );
  }

  /**
   * Change the progress reporting cadence for this manager instance.
   *
   * Accepts a positive integer that divides 100 evenly (1, 2, 4, 5, 10,
   * 20, 25, 50, 100). Throws on anything else — a step that does not
   * divide 100 would leave the final bucket unable to land on exactly
   * 100%, so `meta.purged` would stop advancing before the purge ends.
   *
   * A caller who wants a different cadence for a specific job rather
   * than globally should subclass and override `updateProgress`; this
   * setter is the manager-wide knob.
   */
  setProgressReportPercent(percent: number): void {
    if (
      !Number.isInteger(percent) ||
      percent <= 0 ||
      percent > 100 ||
      100 % percent !== 0
    ) {
      throw new Error(
        `Invalid progress report percent: ${percent}. ` +
          `Expected a positive integer that divides 100 evenly.`,
      );
    }
    this.progressReportPercent = percent;
  }

  /**
   * Create a purge job - automatically handles locking.
   *
   * On failure of the base `create`, the queue is unlocked and the
   * original error is surfaced through the callback. The `return` before
   * `_unlockQueue` is load-bearing: without it, `next(null, job)` would
   * fire synchronously with an undefined job, the caller would resolve
   * with a garbage ID, and the queued `next(err)` inside the unlock
   * callback would be a no-op.
   */
  override create(
    payload: TPurgeQueueJobPayload,
    options: Partial<TPurgeQueueJob> = {},
    cb: ICallback<TPurgeQueueJob>,
  ): void {
    const jobId = options.id || randomUUID();

    async.waterfall(
      [
        // Step 1: Lock the queue with the job ID
        (next: ICallback) => {
          this.lockQueue(payload.queue.queueParams, jobId, next);
        },

        // Step 2: Create the job
        (_, next: ICallback<TPurgeQueueJob>) => {
          super.create(payload, { ...options, id: jobId }, (err, job) => {
            if (err) {
              // If job creation fails, unlock the queue, then surface the
              // original error. The reportedBucket entry is a defensive
              // delete — no entry is created on this path, but keeping the
              // cleanup adjacent to the failure branch makes the map's
              // lifetime obvious to a future reader.
              this.reportedBucket.delete(jobId);
              return _unlockQueue(
                payload.queue.queueParams,
                EQueueStateLockOwner.PURGE_JOB,
                jobId,
                {
                  reason: ESystemStateTransitionReason.PURGE_QUEUE_FAIL,
                  description: `Purge job failed`,
                  metadata: { jobId },
                },
                this.logger,
                () => next(err),
              );
            }
            next(null, job);
          });
        },
      ],
      cb,
    );
  }

  /**
   * Complete purge job - automatically handles unlocking.
   */
  override complete(
    jobId: string,
    options: Partial<TPurgeQueueJob>,
    cb: ICallback<TPurgeQueueJob>,
  ): void {
    async.waterfall(
      [
        // Step 1: Complete the job (base class)
        (next: ICallback<TPurgeQueueJob>) =>
          super.complete(jobId, options, next),

        // Step 2: Release the progress-tracking slot and unlock the queue
        (job: TPurgeQueueJob, next: ICallback<TPurgeQueueJob>) => {
          this.reportedBucket.delete(jobId);
          _unlockQueue(
            job.payload.queue.queueParams,
            EQueueStateLockOwner.PURGE_JOB,
            jobId,
            {
              reason: ESystemStateTransitionReason.PURGE_QUEUE_COMPLETE,
              description: `Purge job complete`,
              metadata: { jobId },
            },
            this.logger,
            (unlockErr) => {
              if (unlockErr) {
                this.logger.error(
                  `Job ${jobId} completed but failed to unlock queue: ${unlockErr.message}`,
                );
              }
              next(null, job); // Don't fail the operation, job is already complete
            },
          );
        },
      ],
      cb,
    );
  }

  /**
   * Fail purge job - automatically handles unlocking.
   */
  override fail(
    jobId: string,
    error: string,
    cb: ICallback<TPurgeQueueJob>,
  ): void {
    async.waterfall(
      [
        // Step 1: Fail the job
        (next: ICallback<TPurgeQueueJob>) => super.fail(jobId, error, next),

        // Step 2: Release the progress-tracking slot and unlock the queue
        (job: TPurgeQueueJob, next: ICallback<TPurgeQueueJob>) => {
          this.reportedBucket.delete(jobId);
          _unlockQueue(
            job.payload.queue.queueParams,
            EQueueStateLockOwner.PURGE_JOB,
            jobId,
            {
              reason: ESystemStateTransitionReason.PURGE_QUEUE_FAIL,
              description: `Purge job failed`,
              metadata: { jobId },
            },
            this.logger,
            (unlockErr) => {
              if (unlockErr) {
                this.logger.error(
                  `Job ${jobId} failed but failed to unlock queue: ${unlockErr.message}`,
                );
              }
              next(null, job); // Don't fail the operation, job is already failed
            },
          );
        },
      ],
      cb,
    );
  }

  /**
   * Cancel purge job - automatically handles unlocking.
   */
  override cancel(jobId: string, cb: ICallback<TPurgeQueueJob>): void {
    async.waterfall(
      [
        // Step 1: Cancel the job (base class)
        (next: ICallback<TPurgeQueueJob>) => super.cancel(jobId, next),

        // Step 2: Release the progress-tracking slot and unlock the queue
        (job: TPurgeQueueJob, next: ICallback<TPurgeQueueJob>) => {
          this.reportedBucket.delete(jobId);
          _unlockQueue(
            job.payload.queue.queueParams,
            EQueueStateLockOwner.PURGE_JOB,
            jobId,
            {
              reason: ESystemStateTransitionReason.PURGE_QUEUE_CANCEL,
              description: `Purge job cancelled`,
              metadata: { jobId },
            },
            this.logger,
            (unlockErr) => {
              if (unlockErr) {
                this.logger.error(
                  `Job ${jobId} cancelled but failed to unlock queue: ${unlockErr.message}`,
                );
              }
              next(null, job); // Don't fail the operation, job is already cancelled
            },
          );
        },
      ],
      cb,
    );
  }

  /**
   * Lock queue for purge.
   */
  private lockQueue(
    queueParams: IQueueParams,
    jobId: string,
    cb: ICallback,
  ): void {
    _lockQueue(
      queueParams,
      EQueueStateLockOwner.PURGE_JOB,
      jobId,
      {
        reason: ESystemStateTransitionReason.PURGE_QUEUE_START,
        description: `Queue is being purged`,
      },
      this.logger,
      (err) => cb(err),
    );
  }

  hasTerminationStatus(jobId: string, cb: ICallback<boolean>): void {
    async.waterfall(
      [
        (next: ICallback<TPurgeQueueJob>) => this.get(jobId, next),
        (job: TPurgeQueueJob, next: ICallback<boolean>) => {
          // Job statuses that should unlock the queue upon completion
          const r =
            job.status === EBackgroundJobStatus.COMPLETED ||
            job.status === EBackgroundJobStatus.FAILED ||
            job.status === EBackgroundJobStatus.CANCELED;
          next(null, r);
        },
      ],
      (err, result) => {
        if (err) {
          if (err instanceof BackgroundJobNotFoundError) {
            return cb(null, false);
          }
        }
        cb(err, result);
      },
    );
  }

  /**
   * Report progress at the configured milestone interval.
   *
   * The previous implementation tested
   * `totalPurged % max(1, floor(totalPurged / 10)) === 0`, which is not
   * equivalent to "every 10%": it fired on every batch for the first
   * ~19 messages and then on an irregular, sparse schedule. This version
   * computes the current bucket from `progressReportPercent` and updates
   * only when it advances past the last reported one.
   *
   * `totalItems` may be zero when the queue is empty or when the first
   * `getMessageIds` call has not yet returned. In that case there is
   * nothing meaningful to report; skip.
   */
  updateProgress(jobId: string, totalPurged: number, totalItems: number): void {
    if (totalItems <= 0) return;

    const bucketCount = 100 / this.progressReportPercent;
    const bucket = Math.min(
      bucketCount,
      Math.floor((totalPurged / totalItems) * bucketCount),
    );

    const lastReported = this.reportedBucket.get(jobId);
    if (lastReported !== undefined && bucket <= lastReported) return;

    this.reportedBucket.set(jobId, bucket);

    const percent = Math.min(100, Math.round((totalPurged / totalItems) * 100));

    this.update(jobId, { meta: { purged: totalPurged } }, (updateErr) => {
      if (updateErr) {
        this.logger.error(
          `Failed to update progress for job ${jobId}:`,
          updateErr,
        );
      } else {
        this.logger.debug(
          `Job ${jobId}: purged ${totalPurged} message(s) (${percent}%)`,
        );
      }
    });
  }
}
