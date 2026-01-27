/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BackgroundJobWorkerAbstract } from '../../../../common/background-job/background-job-worker-abstract.js';
import { async, ICallback, PanicError } from 'redis-smq-common';
import { PurgeQueueJobManager } from './purge-queue-job-manager.js';
import { IBrowserPage, IMessageBrowser } from '../../../../common/index.js';
import { _deleteMessage } from '../../../../message-manager/_/_delete-message.js';
import { QueueMessagesRegistry } from '../../../../common/queue-messages-registry/queue-messages-registry.js';
import {
  EBackgroundJobStatus,
  IBackgroundJob,
} from '../../../../common/index.js';
import { BackgroundJobCanceledError } from '../../../../errors/index.js';
import { TPurgeQueueJobTarget } from './types/index.js';

export class PurgeQueueJob extends BackgroundJobWorkerAbstract {
  protected jobManager: PurgeQueueJobManager | null = null;

  private processNextJob(cb: ICallback<void>): void {
    // Try to acquire a job
    this.getJobManager().acquireNextJob((err, jobId) => {
      if (err) return cb(err);
      if (!jobId) {
        // No job available
        this.logger.info(`No job available.`);
        return cb(null);
      }
      this.logger.info(`Worker ${this.id} acquired job: ${jobId}`);

      // Process the job
      this.executeJob(jobId, (jobErr) => {
        if (jobErr) {
          this.logger.error(`Job ${jobId} failed:`, jobErr);
        } else {
          this.logger.info(`Job ${jobId} completed successfully`);
        }
        cb(jobErr);
      });
    });
  }

  private executeJob(jobId: string, cb: ICallback<void>): void {
    const jobManager = this.getJobManager();
    async.waterfall(
      [
        // Get job details
        (next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>) => {
          jobManager.get(jobId, (err, job) => {
            if (err) return next(err);
            if (!job) return next(new Error(`Job ${jobId} not found`));
            next(null, job);
          });
        },

        // Update job status to processing
        (job, next: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>) => {
          jobManager.start(jobId, (err) => {
            if (err) return next(err);
            next(null, job);
          });
        },

        // Perform the actual purge
        (job, next: ICallback<number>) => {
          const messageBrowser = QueueMessagesRegistry.getMessageBrowser(
            job.target.messageType,
          );
          this.purgeMessages(job, messageBrowser, next);
        },

        // Mark job as completed
        (purgedCount: number, next: ICallback<void>) => {
          jobManager.complete(jobId, { purged: purgedCount }, next);
        },
      ],
      (err) => {
        if (err) {
          return jobManager.fail(jobId, err.message, (err) => {
            if (!err) {
              this.logger.debug(`Successfully marked job ${jobId} as failed`);
            }
            cb();
          });
        }
        cb();
      },
    );
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb) => {
        const redisClient = this.getRedisClient();
        this.jobManager = new PurgeQueueJobManager(redisClient, this.logger);
        this.jobManager.initialize(cb);
      },
    ]);
  }

  protected getJobManager() {
    if (!this.jobManager)
      throw new PanicError({
        message: 'A PurgeQueueJobManager instance is required.',
      });
    return this.jobManager;
  }

  protected purgeMessages(
    job: IBackgroundJob<TPurgeQueueJobTarget>,
    messageBrowser: IMessageBrowser,
    cb: ICallback<number>,
  ): void {
    const parsedParams = job.target.queue;
    const delay = job.delay || 5000;
    const batchSize = job.batchSize || 1000;

    let totalPurged = 0;
    let initialTotalItems = 0;
    let batchCount = 0;

    this.logger.debug(
      `Starting batch purge for queue ${parsedParams.queueParams.name}`,
    );

    // Recursive function to process batches
    const purgeBatch = (): void => {
      batchCount += 1;
      this.logger.debug(
        `Processing purge batch ${batchCount} (batch size = ${batchSize}) for queue ${parsedParams.queueParams.name}`,
      );

      async.waterfall(
        [
          // Check for cancellation before each batch
          (next: ICallback) => {
            this.getJobManager().get(job.id, (err, currentJob) => {
              if (err) {
                return next(err);
              }
              if (
                !currentJob ||
                currentJob.status === EBackgroundJobStatus.CANCELED
              ) {
                return next(
                  new BackgroundJobCanceledError({
                    metadata: { jobId: job.id },
                  }),
                );
              }
              next();
            });
          },

          // Step 1: Get batch of message IDs
          (_, next: ICallback<IBrowserPage<string>>) => {
            messageBrowser.getMessageIds(
              parsedParams,
              1, // always start from page 1
              batchSize,
              next,
            );
          },

          // Step 2: Delete the messages and return next page
          (result: IBrowserPage<string>, next: ICallback<boolean>) => {
            const { items, totalItems } = result;

            // If this is the first batch remember total items
            // After each iteration totalItems will be decreased by batchSize
            if (batchCount === 1) {
              initialTotalItems = totalItems;
              this.logger.info(
                `Queue "${parsedParams.queueParams.name}" has ${initialTotalItems} messages to purge`,
              );
            }

            // If no items, we're done with this batch
            if (items.length === 0) {
              this.logger.debug(
                `No messages to purge in this batch for queue ${parsedParams.queueParams.name}`,
              );
              return next(null, false);
            }

            this.logger.debug(
              `Deleting ${items.length} messages from queue ${parsedParams.queueParams.name}`,
            );

            // Delete the batch of messages
            _deleteMessage(this.getRedisClient(), items, (err, reply) => {
              if (err) {
                this.logger.error(`Error deleting messages: ${err.message}`);
                return next(err);
              }

              const successfullyDeleted = reply?.stats.success || 0;
              totalPurged += successfullyDeleted;

              this.logger.debug(
                `Batch ${batchCount}: Deleted ${successfullyDeleted} messages`,
              );

              // Update progress
              this.getJobManager().updateProgress(
                job.id,
                totalPurged,
                initialTotalItems,
              );

              const shouldContinue = items.length === batchSize;
              next(null, shouldContinue);
            });
          },
        ],
        (err, shouldContinue) => {
          if (err) {
            this.logger.error(`Error in purge batch: ${err.message}`);
            return cb(err);
          }

          // If there are more messages to process, continue with next batch
          if (shouldContinue) {
            this.logger.debug(
              `Got full batch (${batchSize} items), continuing with batch ${batchCount + 1}`,
            );
            if (delay) setTimeout(() => purgeBatch(), delay);
            else purgeBatch();
          } else {
            // All messages purged
            this.logger.info(
              `Successfully purged ${totalPurged} messages from queue "${parsedParams.queueParams.name}"`,
            );
            cb(null, totalPurged);
          }
        },
      );
    };

    // Start purging
    purgeBatch();
  }

  override work(cb: ICallback) {
    async.series(
      [
        // Recover stuck jobs
        (cb: ICallback) => {
          this.getJobManager().recoverStuckJobs(cb);
        },

        // Start processing loop
        (cb: ICallback) => {
          this.processNextJob(cb);
        },
      ],
      (err) => cb(err),
    );
  }
}

export default PurgeQueueJob;
