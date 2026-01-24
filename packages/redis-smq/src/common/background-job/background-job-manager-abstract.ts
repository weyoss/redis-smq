/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, env, ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { randomUUID } from 'node:crypto';
import {
  BackgroundJobAlreadyExistsError,
  BackgroundJobNotCancellableError,
  BackgroundJobNotCompletableError,
  BackgroundJobNotFailableError,
  BackgroundJobNotFoundError,
  BackgroundJobNotStartableError,
  BackgroundJobTargetLockedError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import {
  EBackgroundJobStatus,
  IBackgroundJob,
  IBackgroundJobConfig,
} from './types/index.js';
import { resolve } from 'path';

const batchSize = 1000;
const delay = 5000;

enum ELuaScript {
  CREATE_JOB = 'CREATE_JOB',
  CANCEL_JOB = 'CANCEL_JOB',
  COMPLETE_JOB = 'COMPLETE_JOB',
  FAIL_JOB = 'FAIL_JOB',
  START_JOB = 'START_JOB',
}

const curDir = env.getCurrentDir();
const luaScriptMap = {
  [ELuaScript.CREATE_JOB]: resolve(curDir, './redis/scripts/create-job.lua'),
  [ELuaScript.CANCEL_JOB]: resolve(curDir, './redis/scripts/cancel-job.lua'),
  [ELuaScript.COMPLETE_JOB]: resolve(
    curDir,
    './redis/scripts/complete-job.lua',
  ),
  [ELuaScript.FAIL_JOB]: resolve(curDir, './redis/scripts/fail-job.lua'),
  [ELuaScript.START_JOB]: resolve(curDir, './redis/scripts/start-job.lua'),
};

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

  // Update job
  protected update(
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

  // Helper: Get target lock key
  protected abstract getTargetLockKey(target: Target): string;

  // Release job from processing list (when done)
  protected removeFromProcessing(jobId: string, cb: ICallback<number>): void {
    this.redisClient.lrem(
      this.config.keyBackgroundJobsProcessing,
      0,
      jobId,
      cb,
    );
  }

  initialize(cb: ICallback<void>) {
    this.logger.debug('Loading Redis Lua scripts');
    this.redisClient.loadScriptFiles(luaScriptMap, (err) => {
      if (err) {
        this.logger.error(
          `Failed to load Redis Lua scripts: ${err.message}`,
          err,
        );
      } else {
        this.logger.debug('Redis Lua scripts loaded successfully');
      }
      cb(err);
    });
  }

  // Create a new job
  create(
    target: Target,
    options: Partial<IBackgroundJob<Target>> = {},
    cb: ICallback<string>,
  ): void {
    const jobId = randomUUID();
    const now = Date.now();

    const backgroundJob: IBackgroundJob<Target> = {
      batchSize,
      delay,
      ...options,
      id: jobId,
      target,
      status: EBackgroundJobStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    const targetLockKey = this.getTargetLockKey(target);

    this.redisClient.runScript(
      ELuaScript.CREATE_JOB,
      [
        this.config.keyBackgroundJobs,
        this.config.keyBackgroundJobsPending,
        targetLockKey,
      ],
      [jobId, JSON.stringify(backgroundJob), jobId],
      (err, reply) => {
        if (err) return cb(err);

        switch (reply) {
          case 0:
            return cb(
              new BackgroundJobTargetLockedError({ metadata: { target } }),
            );
          case -1:
            return cb(
              new BackgroundJobAlreadyExistsError({ metadata: { jobId } }),
            );
          case 1:
            this.logger.info(
              `Created job ${jobId} for target "${JSON.stringify(target)}"`,
            );
            return cb(null, jobId);
          default:
            return cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
        }
      },
    );
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

  updateProgress(jobId: string, totalPurged: number, totalItems: number) {
    // Update progress every 10%
    if (
      totalItems > 0 &&
      totalPurged % Math.max(1, Math.floor(totalPurged / 10)) === 0
    ) {
      this.update(jobId, { purged: totalPurged }, (updateErr) => {
        if (updateErr) {
          this.logger.error(
            `Failed to update progress for job ${jobId}:`,
            updateErr,
          );
        } else {
          this.logger.info(
            `Job ${jobId}: Purged ${totalPurged} messages so far`,
          );
        }
      });
    }
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

  // Cancel a job
  cancel(jobId: string, cb: ICallback<void>): void {
    async.waterfall(
      [
        // Get job to get target and current status
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

        // Execute cancel script
        (backgroundJob: IBackgroundJob<Target>, next: ICallback) => {
          const targetLockKey = this.getTargetLockKey(backgroundJob.target);
          const updatedJob = {
            ...backgroundJob,
            status: EBackgroundJobStatus.CANCELED,
            updatedAt: Date.now(),
          };

          this.redisClient.runScript(
            ELuaScript.CANCEL_JOB,
            [
              this.config.keyBackgroundJobs,
              this.config.keyBackgroundJobsPending,
              this.config.keyBackgroundJobsProcessing,
              targetLockKey,
            ],
            [
              jobId,
              JSON.stringify(updatedJob),
              EBackgroundJobStatus.PENDING.toString(),
              EBackgroundJobStatus.PROCESSING.toString(),
              EBackgroundJobStatus.COMPLETED.toString(),
              EBackgroundJobStatus.FAILED.toString(),
              EBackgroundJobStatus.CANCELED.toString(),
            ],
            (err, result) => {
              if (err) return next(err);

              switch (result) {
                case 1:
                  this.logger.info(`Cancelled job ${jobId}`);
                  return next(null);
                case 2:
                  this.logger.warn(`Job ${jobId} was already cancelled`);
                  return next(null);
                case 0:
                  return next(
                    new BackgroundJobNotFoundError({ metadata: { jobId } }),
                  );
                case -1:
                  return next(
                    new BackgroundJobNotCancellableError({
                      metadata: { jobId, reason: 'already completed' },
                    }),
                  );
                case -2:
                  return next(
                    new BackgroundJobNotCancellableError({
                      metadata: { jobId, reason: 'already failed' },
                    }),
                  );
                default:
                  return next(
                    new Error(
                      `Unexpected result from cancel script: ${result}`,
                    ),
                  );
              }
            },
          );
        },
      ],
      cb,
    );
  }

  // Mark job as processing
  start(jobId: string, cb: ICallback<void>): void {
    this.get(jobId, (err, backgroundJob) => {
      if (err) return cb(err);
      if (!backgroundJob)
        return cb(new BackgroundJobNotFoundError({ metadata: { jobId } }));

      const updatedJob = {
        ...backgroundJob,
        status: EBackgroundJobStatus.PROCESSING,
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.redisClient.runScript(
        ELuaScript.START_JOB,
        [
          this.config.keyBackgroundJobs,
          this.config.keyBackgroundJobsProcessing,
        ],
        [
          jobId,
          JSON.stringify(updatedJob),
          EBackgroundJobStatus.PENDING.toString(),
          EBackgroundJobStatus.PROCESSING.toString(),
          EBackgroundJobStatus.COMPLETED.toString(),
          EBackgroundJobStatus.FAILED.toString(),
          EBackgroundJobStatus.CANCELED.toString(),
        ],
        (err, reply) => {
          if (err) return cb(err);

          switch (reply) {
            case 1:
              this.logger.info(`Started processing job ${jobId}`);
              return cb(null);
            case 2:
              this.logger.warn(`Job ${jobId} was already processing`);
              return cb(null);
            case 0:
              return cb(
                new BackgroundJobNotFoundError({ metadata: { jobId } }),
              );
            case -1:
              return cb(
                new BackgroundJobNotStartableError({
                  metadata: {
                    jobId,
                    reason:
                      "Job cannot be started because it's already completed",
                  },
                }),
              );
            case -2:
              return cb(
                new BackgroundJobNotStartableError({
                  metadata: {
                    jobId,
                    reason: "Job cannot be started because it's already failed",
                  },
                }),
              );
            case -3:
              return cb(
                new BackgroundJobNotStartableError({
                  metadata: {
                    jobId,
                    reason:
                      "Job cannot be started because it's already cancelled",
                  },
                }),
              );
            default:
              return cb(
                new UnexpectedScriptReplyError({ metadata: { reply } }),
              );
          }
        },
      );
    });
  }

  // Mark job as completed
  complete(
    jobId: string,
    result: { purged: number },
    cb: ICallback<void>,
  ): void {
    async.waterfall(
      [
        // Get job to get target and current status
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

        // Execute completion script
        (backgroundJob: IBackgroundJob<Target>, next: ICallback) => {
          const targetLockKey = this.getTargetLockKey(backgroundJob.target);
          const updatedJob = {
            ...backgroundJob,
            status: EBackgroundJobStatus.COMPLETED,
            completedAt: Date.now(),
            updatedAt: Date.now(),
            purged: result.purged,
          };

          this.redisClient.runScript(
            ELuaScript.COMPLETE_JOB,
            [
              this.config.keyBackgroundJobs,
              this.config.keyBackgroundJobsProcessing,
              targetLockKey,
            ],
            [
              jobId,
              JSON.stringify(updatedJob),
              EBackgroundJobStatus.PENDING.toString(),
              EBackgroundJobStatus.PROCESSING.toString(),
              EBackgroundJobStatus.COMPLETED.toString(),
              EBackgroundJobStatus.FAILED.toString(),
              EBackgroundJobStatus.CANCELED.toString(),
            ],
            (err, reply) => {
              if (err) return next(err);

              switch (reply) {
                case 1:
                  this.logger.info(`Completed job ${jobId}`);
                  return next(null);
                case 2:
                  this.logger.warn(`Job ${jobId} was already completed`);
                  return next(null);
                case 0:
                  return next(
                    new BackgroundJobNotFoundError({ metadata: { jobId } }),
                  );
                case -1:
                  return next(
                    new BackgroundJobNotCompletableError({
                      metadata: { jobId, reason: 'already failed' },
                    }),
                  );
                case -2:
                  return next(
                    new BackgroundJobNotCompletableError({
                      metadata: { jobId, reason: 'already cancelled' },
                    }),
                  );
                default:
                  return next(
                    new UnexpectedScriptReplyError({ metadata: { reply } }),
                  );
              }
            },
          );
        },
      ],
      cb,
    );
  }

  // Mark job as failed
  fail(jobId: string, error: string, cb: ICallback<void>): void {
    async.waterfall(
      [
        // Get job to get target and current status
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

        // Execute fail script
        (backgroundJob: IBackgroundJob<Target>, next: ICallback) => {
          const targetLockKey = this.getTargetLockKey(backgroundJob.target);
          const updatedJob = {
            ...backgroundJob,
            status: EBackgroundJobStatus.FAILED,
            updatedAt: Date.now(),
            error,
          };

          this.redisClient.runScript(
            ELuaScript.FAIL_JOB, // Need to add this to ELuaScript enum
            [
              this.config.keyBackgroundJobs,
              this.config.keyBackgroundJobsProcessing,
              targetLockKey,
            ],
            [
              jobId,
              JSON.stringify(updatedJob),
              EBackgroundJobStatus.PENDING.toString(),
              EBackgroundJobStatus.PROCESSING.toString(),
              EBackgroundJobStatus.COMPLETED.toString(),
              EBackgroundJobStatus.FAILED.toString(),
              EBackgroundJobStatus.CANCELED.toString(),
            ],
            (err, reply) => {
              if (err) return next(err);

              switch (reply) {
                case 1:
                  this.logger.error(`Job ${jobId} failed: ${error}`);
                  return next(null);
                case 2:
                  this.logger.warn(`Job ${jobId} was already failed`);
                  return next(null);
                case 0:
                  return next(
                    new BackgroundJobNotFoundError({ metadata: { jobId } }),
                  );
                case -1:
                  return next(
                    new BackgroundJobNotFailableError({
                      metadata: {
                        jobId,
                        reason:
                          "Job cannot be marked as failed because it's already completed",
                      },
                    }),
                  );
                case -2:
                  return next(
                    new BackgroundJobNotFailableError({
                      metadata: {
                        jobId,
                        reason:
                          "Job cannot be marked as failed because it's already cancelled",
                      },
                    }),
                  );
                default:
                  return next(
                    new UnexpectedScriptReplyError({ metadata: { reply } }),
                  );
              }
            },
          );
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
}
