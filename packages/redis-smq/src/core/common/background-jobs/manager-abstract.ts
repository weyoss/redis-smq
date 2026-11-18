import { async, env, ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { randomUUID } from 'node:crypto';
import {
  BackgroundJobAlreadyExistsError,
  BackgroundJobNotCancellableError,
  BackgroundJobNotCompletableError,
  BackgroundJobNotFailableError,
  BackgroundJobNotFoundError,
  BackgroundJobNotStartableError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import {
  EBackgroundJobStatus,
  IBackgroundJob,
  IBackgroundJobConfig,
} from './types/index.js';
import { resolve } from 'path';
import { keys } from '../redis/keys/keys.js';
import { _isWorkerAlive } from './helpers/_is-worker-alive.js';

const batchSize = 1000;
const delay = 5000;

enum ELuaScript {
  CREATE_JOB = 'CREATE_JOB',
  CANCEL_JOB = 'CANCEL_JOB',
  COMPLETE_JOB = 'COMPLETE_JOB',
  FAIL_JOB = 'FAIL_JOB',
  START_JOB = 'START_JOB',
  RECOVER_STUCK_JOB = 'RECOVER_STUCK_JOB',
  SAVE_JOB_PROGRESS = 'SAVE_JOB_PROGRESS',
}

const curDir = env.getCurrentDir();
const luaScriptMap = {
  [ELuaScript.CREATE_JOB]: resolve(curDir, './scripts/create-job.lua'),
  [ELuaScript.CANCEL_JOB]: resolve(curDir, './scripts/cancel-job.lua'),
  [ELuaScript.COMPLETE_JOB]: resolve(curDir, './scripts/complete-job.lua'),
  [ELuaScript.FAIL_JOB]: resolve(curDir, './scripts/fail-job.lua'),
  [ELuaScript.START_JOB]: resolve(curDir, './scripts/start-job.lua'),
  [ELuaScript.RECOVER_STUCK_JOB]: resolve(
    curDir,
    './scripts/recover-stuck-job.lua',
  ),
  [ELuaScript.SAVE_JOB_PROGRESS]: resolve(
    curDir,
    './scripts/save-job-progress.lua',
  ),
};

export abstract class ManagerAbstract<
  Payload,
  Meta extends Record<string, unknown> = never,
> {
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

  protected applyPartialUpdate(
    job: IBackgroundJob<Payload, Meta>,
    partial: Partial<IBackgroundJob<Payload, Meta>>,
  ): IBackgroundJob<Payload, Meta> {
    const { meta: partialMeta, ...partialFields } = partial;

    // Merge primitive fields
    const result: IBackgroundJob<Payload, Meta> = {
      ...job,
      ...partialFields,
    };

    // Merge meta object if provided
    if (partialMeta) {
      result.meta = {
        ...job.meta,
        ...partialMeta,
      };
    }

    return result;
  }

  /**
   * Apply a partial update to a background job, atomically guarded by
   * the job's PROCESSING status.
   *
   * Three phases:
   *
   *   1. Read the current job state — source for `applyPartialUpdate`'s
   *      merge, plus a fast-path `BackgroundJobNotFoundError`.
   *   2. Build the fully-merged update payload.
   *   3. Write through `save-job-progress.lua`, which atomically checks
   *      the job is still PROCESSING before applying.
   *
   * Phase 3's guard is what prevents a `cancel` / `complete` / `fail`
   * that landed between the read and the write from being clobbered —
   * without it, `HSET` would revert the status to whatever the read
   * saw and silently lose the terminal transition.
   *
   * Outcomes:
   *
   *   - Reply `1` — write applied while the job was PROCESSING.
   *   - Reply `0` — job deleted between our read and the script's HGET.
   *     Surfaced as `BackgroundJobNotFoundError`.
   *   - Reply `-1` — a concurrent cancel / complete / fail superseded
   *     us. The update is skipped; the callback receives no error
   *     (the terminal transition is the meaningful event, not this
   *     update). A debug line records the skip.
   *
   * Intended for *non-status* updates; `meta.purged` is the current
   * caller (`PurgeQueueJobManager.updateProgress`). Status transitions
   * go through their dedicated scripts (`START_JOB`, `COMPLETE_JOB`,
   * `FAIL_JOB`, `CANCEL_JOB`, `RECOVER_STUCK_JOB`), each of which
   * performs its own state check.
   */
  protected update(
    jobId: string,
    updates: Partial<IBackgroundJob<Payload, Meta>>,
    cb: ICallback<void>,
  ): void {
    this.get(jobId, (err, backgroundJob) => {
      if (err) return cb(err);
      if (!backgroundJob)
        return cb(new BackgroundJobNotFoundError({ metadata: { jobId } }));

      const updatedJob = this.applyPartialUpdate(backgroundJob, {
        ...updates,
        updatedAt: Date.now(),
      });

      this.redisClient.runScript(
        ELuaScript.SAVE_JOB_PROGRESS,
        [this.config.keyBackgroundJobs],
        [
          jobId,
          JSON.stringify(updatedJob),
          EBackgroundJobStatus.PROCESSING.toString(),
        ],
        (scriptErr, reply) => {
          if (scriptErr) return cb(scriptErr);

          switch (reply) {
            case 1:
              // Write landed while the job was still PROCESSING.
              return cb();
            case 0:
              // Job vanished between our read and the script's HGET.
              return cb(
                new BackgroundJobNotFoundError({ metadata: { jobId } }),
              );
            case -1:
              // Job moved out of PROCESSING (cancelled, completed, or
              // failed) between our read and this write. The earlier
              // transition wins; the update is a no-op. Not an error —
              // the caller's next check (or its cancellation listener)
              // will observe the terminal state and stop.
              this.logger.debug(
                `Update for job ${jobId} skipped: no longer in PROCESSING`,
              );
              return cb();
            default:
              return cb(
                new UnexpectedScriptReplyError({ metadata: { reply } }),
              );
          }
        },
      );
    });
  }

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
    payload: Payload,
    options: Partial<IBackgroundJob<Payload, Meta>> = {},
    cb: ICallback<IBackgroundJob<Payload, Meta>>,
  ): void {
    const jobId = options.id ?? randomUUID();
    const now = Date.now();

    const backgroundJob: IBackgroundJob<Payload, Meta> = {
      batchSize,
      delay,
      ...options,
      id: jobId,
      payload,
      status: EBackgroundJobStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    this.redisClient.runScript(
      ELuaScript.CREATE_JOB,
      [this.config.keyBackgroundJobs, this.config.keyBackgroundJobsPending],
      [jobId, JSON.stringify(backgroundJob), jobId],
      (err, reply) => {
        if (err) return cb(err);

        switch (reply) {
          case -1:
            return cb(
              new BackgroundJobAlreadyExistsError({ metadata: { jobId } }),
            );
          case 1:
            this.logger.debug(
              `Created job ${jobId} for target "${JSON.stringify(payload)}"`,
            );
            return cb(null, backgroundJob);
          default:
            return cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
        }
      },
    );
  }

  // Get job by ID
  get(jobId: string, cb: ICallback<IBackgroundJob<Payload, Meta>>): void {
    this.redisClient.hget(this.config.keyBackgroundJobs, jobId, (err, data) => {
      if (err) return cb(err);
      if (!data)
        return cb(new BackgroundJobNotFoundError({ metadata: { jobId } }));
      cb(null, JSON.parse(data));
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
  cancel(jobId: string, cb: ICallback<IBackgroundJob<Payload, Meta>>): void {
    async.waterfall(
      [
        // Get job to get target and current status
        (next: ICallback<IBackgroundJob<Payload, Meta>>) => {
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
        (
          backgroundJob: IBackgroundJob<Payload, Meta>,
          next: ICallback<IBackgroundJob<Payload, Meta>>,
        ) => {
          const { keyJobWorker } = keys.getJobKeys(jobId);
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
              keyJobWorker,
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
                  return next(null, updatedJob);
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
  start(
    jobId: string,
    workerId: string,
    cb: ICallback<IBackgroundJob<Payload, Meta>>,
  ): void {
    this.get(jobId, (err, backgroundJob) => {
      if (err) return cb(err);
      if (!backgroundJob)
        return cb(new BackgroundJobNotFoundError({ metadata: { jobId } }));

      const { keyJobWorker } = keys.getJobKeys(jobId);

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
          keyJobWorker,
        ],
        [
          jobId,
          workerId,
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
              return cb(null, updatedJob);
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
    options: Partial<IBackgroundJob<Payload, Meta>> = {},
    cb: ICallback<IBackgroundJob<Payload, Meta>>,
  ): void {
    async.waterfall(
      [
        // Get job to get target and current status
        (next: ICallback<IBackgroundJob<Payload, Meta>>) => {
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
        (
          backgroundJob: IBackgroundJob<Payload, Meta>,
          next: ICallback<IBackgroundJob<Payload, Meta>>,
        ) => {
          const { keyJobWorker } = keys.getJobKeys(jobId);
          const updatedJob = this.applyPartialUpdate(backgroundJob, {
            ...options,
            status: EBackgroundJobStatus.COMPLETED,
            completedAt: Date.now(),
            updatedAt: Date.now(),
          });

          this.redisClient.runScript(
            ELuaScript.COMPLETE_JOB,
            [
              this.config.keyBackgroundJobs,
              this.config.keyBackgroundJobsProcessing,
              keyJobWorker,
            ],
            [
              jobId,
              JSON.stringify(updatedJob),
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
                  return next(null, updatedJob);
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
  fail(
    jobId: string,
    error: string,
    cb: ICallback<IBackgroundJob<Payload, Meta>>,
  ): void {
    async.waterfall(
      [
        // Get job to get target and current status
        (next: ICallback<IBackgroundJob<Payload, Meta>>) => {
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
        (
          backgroundJob: IBackgroundJob<Payload, Meta>,
          next: ICallback<IBackgroundJob<Payload, Meta>>,
        ) => {
          const { keyJobWorker } = keys.getJobKeys(jobId);
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
              keyJobWorker,
            ],
            [
              jobId,
              JSON.stringify(updatedJob),
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
                  return next(null, updatedJob);
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
    cb: ICallback<IBackgroundJob<Payload, Meta>[]>,
  ): void {
    const limit = filter?.limit || 50;

    // Get all job keys
    this.redisClient.hkeys(this.config.keyBackgroundJobs, (err, jobIds) => {
      if (err) return cb(err);
      if (!jobIds) return cb(null, []);

      // Get jobs in parallel (limited by limit)
      const jobsToGet = jobIds.slice(0, limit * 2); // Get extra for filtering
      const jobs: IBackgroundJob<Payload, Meta>[] = [];
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
            if (filter?.target && backgroundJob.payload !== filter.target) {
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
    this.logger.debug(`Checking for stuck jobs...`);

    // Get all jobs in processing list
    this.redisClient.lrange(
      this.config.keyBackgroundJobsProcessing,
      0,
      -1,
      (err, jobIds) => {
        if (err) return cb(err);

        if (!jobIds || jobIds.length === 0) {
          this.logger.debug('No stuck jobs found');
          return cb(null);
        }

        this.logger.debug(`Found ${jobIds.length} potentially stuck jobs`);
        let recovered = 0;
        let skipped = 0;
        let failed = 0;

        // Process each job in processing list
        async.eachOf(
          jobIds,
          (jobId, _, next) => {
            async.waterfall(
              [
                // Step 1: Check if workers is alive
                (cb: ICallback<boolean>) => {
                  _isWorkerAlive(jobId, (err, isAlive) => {
                    if (err) {
                      this.logger.error(
                        `Error checking worker liveness for job ${jobId}:`,
                        err,
                      );
                      return cb(err);
                    }

                    if (isAlive) {
                      this.logger.debug(
                        `Worker for job ${jobId} is still alive, skipping recovery`,
                      );
                      return cb(null, false); // Worker alive, don't recover
                    }

                    cb(null, true); // Worker dead, proceed with recovery
                  });
                },

                // Step 2: Recover the stuck job using Lua script
                (shouldRecover: boolean, cb: ICallback) => {
                  if (!shouldRecover) {
                    skipped++;
                    return cb(null);
                  }

                  // We need to get job data to know the target for lock key
                  this.get(jobId, (err, job) => {
                    if (err) {
                      this.logger.error(
                        `Error getting job ${jobId} for recovery:`,
                        err,
                      );
                      failed++;
                      return cb(err);
                    }

                    if (!job) {
                      // Job doesn't exist in hash but is in processing list - clean up
                      this.logger.debug(
                        `Job ${jobId} not found, removing from processing list`,
                      );
                      this.removeFromProcessing(jobId, () => {
                        skipped++;
                        cb(null);
                      });
                      return;
                    }

                    const { keyJobWorker } = keys.getJobKeys(jobId);
                    const recoveryMessage = 'Recovered from workers crash';

                    const updatedJob = {
                      ...job,
                      status: EBackgroundJobStatus.PENDING,
                      error: recoveryMessage,
                      updatedAt: Date.now(),
                    };

                    this.redisClient.runScript(
                      ELuaScript.RECOVER_STUCK_JOB,
                      [
                        this.config.keyBackgroundJobs,
                        this.config.keyBackgroundJobsPending,
                        this.config.keyBackgroundJobsProcessing,
                        keyJobWorker,
                      ],
                      [
                        jobId,
                        JSON.stringify(updatedJob),
                        EBackgroundJobStatus.PROCESSING.toString(),
                        EBackgroundJobStatus.COMPLETED.toString(),
                        EBackgroundJobStatus.FAILED.toString(),
                        EBackgroundJobStatus.CANCELED.toString(),
                        recoveryMessage,
                      ],
                      (err, reply) => {
                        if (err) {
                          this.logger.error(
                            `Error recovering job ${jobId}:`,
                            err,
                          );
                          failed++;
                          return cb(err);
                        }

                        switch (reply) {
                          case 1:
                            this.logger.info(
                              `Successfully recovered stuck job ${jobId}`,
                            );
                            recovered++;
                            break;
                          case 0:
                            this.logger.debug(
                              `Job ${jobId} not found or not in recoverable state`,
                            );
                            skipped++;
                            break;
                          case -1:
                            this.logger.debug(`Job ${jobId} already completed`);
                            skipped++;
                            break;
                          case -2:
                            this.logger.debug(`Job ${jobId} already failed`);
                            skipped++;
                            break;
                          case -3:
                            this.logger.debug(`Job ${jobId} already cancelled`);
                            skipped++;
                            break;
                          default:
                            this.logger.warn(
                              `Unexpected reply for job ${jobId}: ${reply}`,
                            );
                            failed++;
                        }
                        cb(null);
                      },
                    );
                  });
                },
              ],
              (err) => next(err),
            );
          },
          (err) => {
            if (err) {
              this.logger.error('Error during stuck job recovery:', err);
              return cb(err);
            }

            this.logger.debug(
              `Stuck job recovery complete: ${recovered} recovered, ${skipped} skipped, ${failed} failed`,
            );
            cb(null);
          },
        );
      },
    );
  }
}
