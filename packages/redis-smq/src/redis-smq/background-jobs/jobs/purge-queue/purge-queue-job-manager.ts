/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BackgroundJobManagerAbstract } from '../../../../common/background-job/background-job-manager-abstract.js';
import { async, ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../../common/redis/redis-keys/redis-keys.js';
import { TPurgeQueueJobTarget } from './types/index.js';
import {
  EQueueStateLockOwner,
  EQueueStateTransitionReason,
} from '../../../../queue-state-manager/index.js';
import { IQueueParams } from '../../../../queue-manager/index.js';
import {
  EBackgroundJobStatus,
  IBackgroundJob,
} from '../../../../common/index.js';
import { randomUUID } from 'node:crypto';
import { BackgroundJobNotFoundError } from '../../../../errors/index.js';
import { _lockQueuelock } from '../../../../queue-state-manager/helpers/_lock-queue.js';
import { _unlockQueue } from '../../../../queue-state-manager/helpers/_unlock-queue.js';

export class PurgeQueueJobManager extends BackgroundJobManagerAbstract<TPurgeQueueJobTarget> {
  constructor(redisClient: IRedisClient, logger: ILogger) {
    const keys = redisKeys.getMainKeys();
    super(
      redisClient,
      {
        keyBackgroundJobs: keys.keyPurgeQueueBackgroundJobs,
        keyBackgroundJobsPending: keys.keyPurgeQueueBackgroundJobsPending,
        keyBackgroundJobsProcessing: keys.keyPurgeQueueBackgroundJobsProcessing,
      },
      logger,
    );
  }

  override getTargetLockKey(target: TPurgeQueueJobTarget): string {
    const { keyPurgeQueueTargetLock } = redisKeys.getPurgeQueueTargetKeys(
      target.queue.queueParams,
      target.queue.groupId,
    );
    return keyPurgeQueueTargetLock;
  }

  /**
   * Create a purge job - automatically handles locking
   */
  override create(
    target: TPurgeQueueJobTarget,
    options: Partial<IBackgroundJob<TPurgeQueueJobTarget>> = {},
    cb: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
  ): void {
    const jobId = options.id || randomUUID();

    async.waterfall(
      [
        // Step 1: Lock the queue with the job ID
        (next: ICallback) => {
          this.lockQueue(target.queue.queueParams, jobId, next);
        },

        // Step 2: Create the job
        (_, next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>) => {
          super.create(target, { ...options, id: jobId }, (err, job) => {
            if (err) {
              // If job creation fails, unlock the queue
              _unlockQueue(
                target.queue.queueParams,
                EQueueStateLockOwner.PURGE_JOB,
                jobId,
                {
                  reason: EQueueStateTransitionReason.PURGE_QUEUE_FAIL,
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
    result: { purged: number },
    cb: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
  ): void {
    async.waterfall(
      [
        // Step 1: Complete the job (base class)
        (next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>) => {
          super.complete(jobId, result, next);
        },

        // Step 2: Unlock the queue
        (
          job: IBackgroundJob<TPurgeQueueJobTarget>,
          next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
        ) => {
          _unlockQueue(
            job.target.queue.queueParams,
            EQueueStateLockOwner.PURGE_JOB,
            jobId,
            {
              reason: EQueueStateTransitionReason.PURGE_QUEUE_COMPLETE,
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
    cb: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
  ): void {
    async.waterfall(
      [
        // Step 1: Fail the job
        (next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>) =>
          super.fail(jobId, error, next),

        // Step 2: Unlock the queue
        (
          job: IBackgroundJob<TPurgeQueueJobTarget>,
          next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
        ) => {
          _unlockQueue(
            job.target.queue.queueParams,
            EQueueStateLockOwner.PURGE_JOB,
            jobId,
            {
              reason: EQueueStateTransitionReason.PURGE_QUEUE_FAIL,
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
  override cancel(
    jobId: string,
    cb: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
  ): void {
    async.waterfall(
      [
        // Step 1: Cancel the job (base class)
        (next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>) =>
          super.cancel(jobId, next),

        // Step 2: Unlock the queue
        (
          job: IBackgroundJob<TPurgeQueueJobTarget>,
          next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
        ) => {
          _unlockQueue(
            job.target.queue.queueParams,
            EQueueStateLockOwner.PURGE_JOB,
            jobId,
            {
              reason: EQueueStateTransitionReason.PURGE_QUEUE_CANCEL,
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
    _lockQueuelock(
      queueParams,
      EQueueStateLockOwner.PURGE_JOB,
      jobId,
      {
        reason: EQueueStateTransitionReason.PURGE_QUEUE_START,
        description: `Queue is being purged`,
      },
      this.logger,
      (err) => cb(err),
    );
  }

  validateJob(jobId: string, cb: ICallback<boolean>): void {
    this.logger.info('Starting recovery of orphaned purge locks...');
    async.waterfall(
      [
        (next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>) =>
          this.get(jobId, next),
        (
          job: IBackgroundJob<TPurgeQueueJobTarget>,
          next: ICallback<boolean>,
        ) => {
          const r =
            job.status !== EBackgroundJobStatus.COMPLETED &&
            job.status !== EBackgroundJobStatus.FAILED &&
            job.status !== EBackgroundJobStatus.CANCELED;
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
}
