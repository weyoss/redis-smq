/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BackgroundJobWorkerAbstract } from '../background-job-worker-abstract.js';
import { async, ICallback, PanicError } from 'redis-smq-common';
import {
  PurgeQueueJobManager,
  TPurgeQueueJobTarget,
} from '../purge-queue-job-manager.js';
import { IBackgroundJob } from '../background-job-manager-abstract.js';
import {
  IBrowserPage,
  IMessageBrowser,
} from '../../message-browser/types/index.js';
import { _deleteMessage } from '../../../message-manager/_/_delete-message.js';
import { QueueMessagesRegistry } from '../../queue-messages-registry/queue-messages-registry.js';

export class PurgeQueueWorker extends BackgroundJobWorkerAbstract {
  protected jobManager: PurgeQueueJobManager | null = null;

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb) => {
        const redisClient = this.getRedisClient();
        this.jobManager = new PurgeQueueJobManager(redisClient, this.logger);
        cb();
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
        // Always remove from processing list, even on failure
        jobManager.removeFromProcessing(jobId, () => {
          if (err && err.message !== 'Job was cancelled') {
            // Mark job as failed if not cancelled
            jobManager.fail(jobId, err.message, (failErr) => {
              if (failErr) {
                this.logger.error(
                  `Failed to mark job ${jobId} as failed:`,
                  failErr,
                );
              }
              cb(err);
            });
          } else {
            cb(err);
          }
        });
      },
    );
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

    this.logger.debug(
      `Starting batch purge for queue ${parsedParams.queueParams.name}`,
    );

    // Recursive function to process batches
    const purgeBatch = (batchCount = 1): void => {
      this.logger.debug(
        `Processing purge batch ${batchCount} (batch size = ${batchSize}) for queue ${parsedParams.queueParams.name}`,
      );

      async.waterfall(
        [
          // Step 1: Get batch of message IDs
          (next: ICallback<IBrowserPage<string>>) => {
            messageBrowser.getMessageIds(
              parsedParams,
              batchCount,
              batchSize,
              next,
            );
          },

          // Step 2: Delete the messages and return next page
          (result: IBrowserPage<string>, next: ICallback<number>) => {
            const { items } = result;

            // If no items, we're done with this batch
            if (items.length === 0) {
              this.logger.debug(
                `No messages to purge in this batch for queue ${parsedParams.queueParams.name}`,
              );
              return next();
            }

            this.logger.debug(
              `Deleting batch of ${items.length} messages from queue ${parsedParams.queueParams.name}`,
            );

            // Delete the batch of messages
            _deleteMessage(this.getRedisClient(), items, (err, reply) => {
              if (err) {
                this.logger.error(`Error deleting messages: ${err.message}`);
                return next(err);
              }
              this.logger.debug(`Purge batch ${batchCount} completed`, reply);
              totalPurged += reply?.stats.success || 0;

              // Update progress every 10 batches
              if (batchCount % 10 === 0) {
                this.getJobManager().update(
                  job.id,
                  { purged: totalPurged, updatedAt: Date.now() },
                  (updateErr) => {
                    if (updateErr) {
                      this.logger.error(
                        `Failed to update progress for job ${job.id}:`,
                        updateErr,
                      );
                    } else {
                      this.logger.info(
                        `Job ${job.id}: Purged ${totalPurged} messages so far`,
                      );
                    }
                  },
                );
              }

              next(null, batchCount + 1);
            });
          },
        ],
        (err, nextPage) => {
          if (err) {
            this.logger.error(`Error in purge batch: ${err.message}`);
            return cb(err);
          }

          // If there are more messages to process, continue with next batch
          if (nextPage) {
            this.logger.debug(
              `More messages to purge, continuing with page ${nextPage} for queue ${parsedParams.queueParams.name}`,
            );
            if (delay) setTimeout(() => purgeBatch(nextPage), delay);
            else purgeBatch(nextPage);
          } else {
            // All messages purged
            this.logger.info(
              `Successfully purged all messages from queue ${parsedParams.queueParams.name}`,
            );
            cb(null, totalPurged);
          }
        },
      );
    };

    // Start purging from the first batch
    purgeBatch(1);
  }
}

export default PurgeQueueWorker;
