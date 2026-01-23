/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { randomUUID } from 'node:crypto';
import {
  BackgroundJobNotFoundError,
  BackgroundJobTargetLockedError,
} from '../../errors/index.js';
import {
  EBackgroundJobStatus,
  IBackgroundJob,
  IBackgroundJobConfig,
} from './types/index.js';

export abstract class BackgroundJobManagerAbstract<Target> {
  protected readonly config: IBackgroundJobConfig;
  protected readonly redisClient: IRedisClient;
  protected readonly logger: ILogger;

  protected constructor(
    redisClient: IRedisClient,
    config: IBackgroundJobConfig,
    logger: ILogger,
  ) {
    this.redisClient = redisClient;
    this.logger = logger.createLogger(this.constructor.name);
    this.config = config;
  }

  // Create a new job
  create(
    target: Target,
    options: Partial<IBackgroundJob<Target>> = {},
    cb: ICallback<string>,
  ): void {
    async.waterfall(
      [
        // Check if target is locked (already being processed)
        (next: ICallback<boolean>) => {
          this.isTargetLocked(target, next);
        },

        // Create job if target not locked
        (isLocked: boolean, next: ICallback<string>) => {
          if (isLocked) {
            return next(
              new BackgroundJobTargetLockedError({ metadata: { target } }),
            );
          }

          const jobId = randomUUID();
          const now = Date.now();

          const backgroundJob: IBackgroundJob<Target> = {
            id: jobId,
            target,
            status: EBackgroundJobStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            batchSize: 1000,
            delay: 100,
            ...options,
          };

          this.executeCreateTransaction(jobId, backgroundJob, target, next);
        },
      ],
      cb,
    );
  }

  // Execute create transaction atomically
  private executeCreateTransaction(
    jobId: string,
    backgroundJob: IBackgroundJob<Target>,
    target: Target,
    cb: ICallback<string>,
  ): void {
    const multi = this.redisClient.multi();

    // Store job data in hash
    multi.hset(
      this.config.keyBackgroundJobs,
      jobId,
      JSON.stringify(backgroundJob),
    );

    // Add to pending list
    multi.lpush(this.config.keyBackgroundJobsPending, jobId);

    // Lock target
    const targetLockKey = this.getTargetLockKey(target);
    multi.set(targetLockKey, jobId, {});

    multi.exec((err) => {
      if (err) return cb(err);
      this.logger.info(
        `Created job ${jobId} for target "${JSON.stringify(target)}"`,
      );
      cb(null, jobId);
    });
  }

  // Get job by ID
  get(jobId: string, cb: ICallback<IBackgroundJob<Target> | null>): void {
    this.redisClient.hget(this.config.keyBackgroundJobs, jobId, (err, data) => {
      if (err) return cb(err);
      if (!data)
        return cb(new BackgroundJobNotFoundError({ metadata: { jobId } }));
      cb(null, JSON.parse(data));
    });
  }

  // Update job
  update(
    jobId: string,
    updates: Partial<IBackgroundJob<Target>>,
    cb: ICallback<void>,
  ): void {
    this.get(jobId, (err, backgroundJob) => {
      if (err) return cb(err);
      if (!backgroundJob)
        return cb(new BackgroundJobNotFoundError({ metadata: { jobId } }));

      const updatedJob: IBackgroundJob<Target> = {
        ...backgroundJob,
        ...updates,
        updatedAt: Date.now(),
      };

      this.redisClient.hset(
        this.config.keyBackgroundJobs,
        jobId,
        JSON.stringify(updatedJob),
        (setErr) => cb(setErr),
      );
    });
  }

  // Check if target is locked (being processed)
  isTargetLocked(target: Target, cb: ICallback<boolean>): void {
    const targetLockKey = this.getTargetLockKey(target);

    async.waterfall(
      [
        // Get job ID from target lock
        (next: ICallback<string | null>) => {
          this.redisClient.get(targetLockKey, next);
        },

        // Check job status if exists
        (jobId: string | null, next: ICallback<boolean>) => {
          if (!jobId) return next(null, false);

          this.get(jobId, (err, backgroundJob) => {
            if (err) return next(err);

            if (!backgroundJob) {
              // Clean up stale lock
              this.redisClient.del(targetLockKey, () => {
                next(null, false);
              });
              return;
            }

            next(
              null,
              [
                EBackgroundJobStatus.PENDING,
                EBackgroundJobStatus.PROCESSING,
              ].includes(backgroundJob.status),
            );
          });
        },
      ],
      cb,
    );
  }

  // Get active job for a target
  getActiveJob(
    target: Target,
    cb: ICallback<IBackgroundJob<Target> | null>,
  ): void {
    const targetLockKey = this.getTargetLockKey(target);

    this.redisClient.get(targetLockKey, (err, jobId) => {
      if (err) return cb(err);
      if (!jobId) return cb(null, null);

      this.get(jobId, cb);
    });
  }

  // Cancel a job
  cancel(jobId: string, cb: ICallback<void>): void {
    async.waterfall(
      [
        // Get job
        (next: ICallback<IBackgroundJob<Target>>) => {
          this.get(jobId, (err, backgroundJob) => {
            if (err) return next(err);
            if (!backgroundJob)
              return next(
                new BackgroundJobNotFoundError({ metadata: { jobId } }),
              );
            next(null, backgroundJob);
          });
        },

        // Execute cancel transaction
        (backgroundJob: IBackgroundJob<Target>, next: ICallback) => {
          const targetLockKey = this.getTargetLockKey(backgroundJob.target);

          const multi = this.redisClient.multi();

          // Update job status
          multi.hset(
            this.config.keyBackgroundJobs,
            jobId,
            JSON.stringify({
              ...backgroundJob,
              status: EBackgroundJobStatus.CANCELED,
              updatedAt: Date.now(),
            }),
          );

          // Remove from pending list
          multi.lrem(this.config.keyBackgroundJobsPending, 0, jobId);

          // Remove from processing list
          multi.lrem(this.config.keyBackgroundJobsProcessing, 0, jobId);

          // Release target lock
          multi.del(targetLockKey);

          multi.exec((err) => next(err));
        },
      ],
      cb,
    );
  }

  // Acquire next pending job (atomic operation for workers)
  acquireNextJob(cb: ICallback<string | null>): void {
    // BRPOPLPUSH for atomic move from pending to processing
    this.redisClient.brpoplpush(
      this.config.keyBackgroundJobsPending,
      this.config.keyBackgroundJobsProcessing,
      0, // 0 = block indefinitely
      cb,
    );
  }

  // Release job from processing list (when done)
  removeFromProcessing(jobId: string, cb: ICallback<number>): void {
    this.redisClient.lrem(
      this.config.keyBackgroundJobsProcessing,
      0,
      jobId,
      cb,
    );
  }

  // Mark job as processing
  start(jobId: string, cb: ICallback): void {
    this.update(
      jobId,
      {
        status: EBackgroundJobStatus.PROCESSING,
        startedAt: Date.now(),
      },
      cb,
    );
  }

  // Mark job as completed
  complete(
    jobId: string,
    result: { purged: number },
    cb: ICallback<void>,
  ): void {
    async.waterfall(
      [
        // Get job
        (next: ICallback<IBackgroundJob<Target>>) => {
          this.get(jobId, (err, backgroundJob) => {
            if (err) return next(err);
            if (!backgroundJob)
              return next(
                new BackgroundJobNotFoundError({ metadata: { jobId } }),
              );
            next(null, backgroundJob);
          });
        },

        // Execute completion transaction
        (backgroundJob: IBackgroundJob<Target>, next: ICallback) => {
          const targetLockKey = this.getTargetLockKey(backgroundJob.target);

          const multi = this.redisClient.multi();

          // Update job
          multi.hset(
            this.config.keyBackgroundJobs,
            jobId,
            JSON.stringify({
              ...backgroundJob,
              status: EBackgroundJobStatus.COMPLETED,
              completedAt: Date.now(),
              updatedAt: Date.now(),
              purged: result.purged,
            }),
          );

          // Remove from processing list
          multi.lrem(this.config.keyBackgroundJobsProcessing, 0, jobId);

          // Release target lock
          multi.del(targetLockKey);

          multi.exec((err) => next(err));
        },
      ],
      cb,
    );
  }

  // Mark job as failed
  fail(jobId: string, error: string, cb: ICallback<void>): void {
    async.waterfall(
      [
        // Get job
        (next: ICallback<IBackgroundJob<Target>>) => {
          this.get(jobId, (err, backgroundJob) => {
            if (err) return next(err);
            if (!backgroundJob)
              return next(
                new BackgroundJobNotFoundError({ metadata: { jobId } }),
              );
            next(null, backgroundJob);
          });
        },

        // Execute failure transaction
        (backgroundJob: IBackgroundJob<Target>, next: ICallback) => {
          const targetLockKey = this.getTargetLockKey(backgroundJob.target);

          const multi = this.redisClient.multi();

          // Update job
          multi.hset(
            this.config.keyBackgroundJobs,
            jobId,
            JSON.stringify({
              ...backgroundJob,
              status: EBackgroundJobStatus.FAILED,
              updatedAt: Date.now(),
              error,
            }),
          );

          // Remove from processing list
          multi.lrem(this.config.keyBackgroundJobsProcessing, 0, jobId);

          // Release target lock
          multi.del(targetLockKey);

          multi.exec((err) => next(err));
        },
      ],
      cb,
    );
  }

  // List jobs with pagination and filtering
  list(
    filter: {
      status?: EBackgroundJobStatus;
      target?: string;
      limit?: number;
    },
    cb: ICallback<IBackgroundJob<Target>[]>,
  ): void {
    const limit = filter?.limit || 50;

    // Get all job keys
    this.redisClient.hkeys(this.config.keyBackgroundJobs, (err, jobIds) => {
      if (err) return cb(err);
      if (!jobIds) return cb(null, []);

      // Get jobs in parallel (limited by limit)
      const jobsToGet = jobIds.slice(0, limit * 2); // Get extra for filtering
      const jobs: IBackgroundJob<Target>[] = [];
      let processed = 0;

      const processNext = () => {
        if (processed >= jobsToGet.length || jobs.length >= limit) {
          return cb(null, jobs);
        }

        const jobId = jobsToGet[processed];
        processed++;

        this.get(jobId, (err, backgroundJob) => {
          if (err) {
            this.logger.warn(`Failed to get job ${jobId}:`, err);
            return processNext();
          }

          if (backgroundJob) {
            // Apply filters
            if (filter?.status && backgroundJob.status !== filter.status) {
              return processNext();
            }
            if (filter?.target && backgroundJob.target !== filter.target) {
              return processNext();
            }

            jobs.push(backgroundJob);
          }

          processNext();
        });
      };

      processNext();
    });
  }

  recoverStuckJobs(cb: ICallback): void {
    this.logger.info(`Checking for stuck jobs...`);

    // Get all jobs in processing list
    this.redisClient.lrange(
      this.config.keyBackgroundJobsProcessing,
      0,
      -1,
      (err, jobIds) => {
        if (err) return cb(err);

        if (!jobIds || jobIds.length === 0) {
          this.logger.info('No stuck jobs found');
          return cb(null);
        }

        this.logger.info(`Found ${jobIds.length} potentially stuck jobs`);

        // Process each stuck job
        async.eachOf(
          jobIds,
          (jobId, _, next) => {
            this.get(jobId, (err, job) => {
              if (err) {
                this.logger.error(`Error getting stuck job ${jobId}:`, err);
                // Remove from processing list anyway
                this.removeFromProcessing(jobId, () => next());
                return;
              }

              if (!job) {
                // Job doesn't exist, clean up
                this.logger.info(`Removing non-existent stuck job: ${jobId}`);
                this.removeFromProcessing(jobId, () => next());
                return;
              }

              if (job.status === EBackgroundJobStatus.PROCESSING) {
                // Job was processing but worker crashed
                this.logger.info(
                  `Recovering stuck job: ${jobId} for queue ${job.target}`,
                );

                // Reset to pending so it can be retried
                this.update(
                  jobId,
                  {
                    status: EBackgroundJobStatus.PENDING,
                    error: 'Recovered from worker crash',
                    updatedAt: Date.now(),
                  },
                  (updateErr) => {
                    if (updateErr) {
                      this.logger.error(
                        `Failed to update stuck job ${jobId}:`,
                        updateErr,
                      );
                    }

                    // Move back to pending list
                    this.redisClient.lpush(
                      this.config.keyBackgroundJobsPending,
                      jobId,
                      (pushErr) => {
                        if (pushErr) {
                          this.logger.error(
                            `Failed to move job ${jobId} to pending:`,
                            pushErr,
                          );
                        }

                        // Remove from processing
                        this.removeFromProcessing(jobId, (err) => next(err));
                      },
                    );
                  },
                );
              } else {
                // Job is not processing, just clean up
                this.removeFromProcessing(jobId, (err) => next(err));
              }
            });
          },
          cb,
        );
      },
    );
  }

  // Helper: Get target lock key
  protected abstract getTargetLockKey(target: Target): string;
}
