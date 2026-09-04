/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BackgroundJobManagerAbstract } from '../../../abstract/background-job/background-job-manager-abstract.js';
import { async, ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../redis/redis-keys/redis-keys.js';
import {
  TPurgeQueueJob,
  TPurgeQueueJobMeta,
  TPurgeQueueJobPayload,
} from './types/index.js';
import {
  EQueueStateLockOwner,
  ESystemStateTransitionReason,
} from '../../../../queue-state-manager/index.js';
import { IQueueParams } from '../../../../queue-manager/index.js';
import { EBackgroundJobStatus } from '../../../index.js';
import { randomUUID } from 'node:crypto';
import { BackgroundJobNotFoundError } from '../../../../errors/index.js';
import { _lockQueue } from '../../../../queue-state-manager/_/_lock-queue.js';
import { _unlockQueue } from '../../../../queue-state-manager/_/_unlock-queue.js';

export class PurgeQueueJobManager extends BackgroundJobManagerAbstract<
  TPurgeQueueJobPayload,
  TPurgeQueueJobMeta
> {
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
   * Create a purge job - automatically handles locking
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
              // If job creation fails, unlock the queue
              _unlockQueue(
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
   * Complete purge job - automatically handles unlocking
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

        // Step 2: Unlock the queue
        (job: TPurgeQueueJob, next: ICallback<TPurgeQueueJob>) => {
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
              next(null, job); // Don't fail the operation, job is already failed
            },
          );
        },
      ],
      cb,
    );
  }

  /**
   * Fail purge job - automatically handles unlocking
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

        // Step 2: Unlock the queue
        (job: TPurgeQueueJob, next: ICallback<TPurgeQueueJob>) => {
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
   * Cancel purge job - automatically handles unlocking
   */
  override cancel(jobId: string, cb: ICallback<TPurgeQueueJob>): void {
    async.waterfall(
      [
        // Step 1: Cancel the job (base class)
        (next: ICallback<TPurgeQueueJob>) => super.cancel(jobId, next),

        // Step 2: Unlock the queue
        (job: TPurgeQueueJob, next: ICallback<TPurgeQueueJob>) => {
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
              next(null, job); // Don't fail the operation, job is already failed
            },
          );
        },
      ],
      cb,
    );
  }

  /**
   * Lock queue for purge
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

  updateProgress(jobId: string, totalPurged: number, totalItems: number) {
    // Update progress every 10% of total items
    const progressInterval = Math.max(1, Math.floor(totalItems / 10));
    if (totalItems > 0 && totalPurged % progressInterval === 0) {
      this.update(jobId, { meta: { purged: totalPurged } }, (updateErr) => {
        if (updateErr) {
          this.logger.error(
            `Failed to update progress for job ${jobId}:`,
            updateErr,
          );
        } else {
          this.logger.debug(
            `Job ${jobId}: Purged ${totalPurged} messages so far`,
          );
        }
      });
    }
  }
}
