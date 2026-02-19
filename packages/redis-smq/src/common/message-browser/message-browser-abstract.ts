/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
  ILogger,
} from 'redis-smq-common';
import { redisKeys } from '../redis/redis-keys/redis-keys.js';
import { IMessageTransferable } from '../../message/index.js';
import { _parseQueueExtendedParams } from '../../queue-manager/_/_parse-queue-extended-params.js';
import {
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../../queue-manager/index.js';
import { _validateQueueExtendedParams } from './_/_validate-queue-extended-params.js';
import {
  IBrowserPage,
  IBrowserPageInfo,
  IMessageBrowser,
} from './types/index.js';
import { MessageManager } from '../../message-manager/index.js';
import { withSharedPoolConnection } from '../redis/redis-connection-pool/with-shared-pool-connection.js';
import { InvalidPurgeQueueJobIdError } from '../../errors/index.js';
import { IBrowserStorage } from './browser-storage/browser-storage-abstract.js';
import { EQueueMessageType } from '../queue-messages-registry/types/index.js';
import { Configuration } from '../../config/index.js';
import { PurgeQueueJobManager } from '../../redis-smq/background-jobs/jobs/purge-queue/purge-queue-job-manager.js';
import {
  EBackgroundJobStatus,
  IBackgroundJob,
} from '../background-job/types/index.js';
import { TPurgeQueueJobTarget } from '../../redis-smq/index.js';
import {
  EQueueOperation,
  QueueOperationValidator,
} from '../../queue-operation-validator/index.js';

/**
 * Provides a base implementation for browsing and managing messages within a
 * specific queue category (e.g., pending, acknowledged, dead-lettered).
 *
 * This abstract class encapsulates the common logic for counting messages,
 * fetching them in paginated sets, and purging them from the queue.
 * Subclasses are responsible for providing the specific Redis key and storage
 * strategy for the message category they represent.
 *
 * @abstract
 * @implements {IMessageBrowser}
 */
export abstract class MessageBrowserAbstract implements IMessageBrowser {
  /**
   * Flag indicating if a consumer group ID is required during validation.
   */
  protected requireGroupId: boolean = false;

  /**
   * Message manager for retrieving detailed message information.
   */
  protected readonly messageManager: MessageManager;

  /**
   * Redis key for the message collection.
   * Subclasses must specify this to correctly target the underlying Redis key.
   */
  protected abstract readonly redisKey: keyof ReturnType<
    typeof redisKeys.getQueueKeys
  >;

  /**
   * Storage implementation for the specific Redis data structure.
   */
  protected readonly messageStorage: IBrowserStorage;

  /**
   * Logger instance for logging operations.
   */
  protected readonly logger: ILogger;

  /**
   * Type of queue messages this browser handles.
   */
  abstract readonly messageType: EQueueMessageType;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
    this.messageManager = new MessageManager();
    this.messageStorage = this.createDefaultStorage();
  }

  /**
   * Creates default storage implementation.
   * Can be overridden by subclasses if needed.
   */
  protected abstract createDefaultStorage(): IBrowserStorage;

  /**
   * Helper method to execute operations with validated queue parameters.
   * Encapsulates the common validation pattern used across multiple methods.
   */
  protected withValidatedQueue<T>(
    queue: TQueueExtendedParams,
    operation: (params: IQueueParsedParams, cb: ICallback<T>) => void,
    cb: ICallback<T>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters: ${parsedParams.message}`,
      );
      return cb(parsedParams);
    }

    withSharedPoolConnection((client, cb) => {
      _validateQueueExtendedParams(
        client,
        parsedParams,
        this.requireGroupId,
        (err) => {
          if (err) {
            this.logger.error(
              `Error validating queue parameters: ${err.message}`,
            );
            return cb(err);
          }
          operation(parsedParams, cb);
        },
      );
    }, cb);
  }

  /**
   * Helper method to get a purge queue job manager instance
   */
  protected withPurgeQueueJobManager<T>(
    operation: (
      purgeQueueJobManager: PurgeQueueJobManager,
      cb: ICallback<T>,
    ) => void,
    cb: ICallback<T>,
  ): void {
    withSharedPoolConnection((client, cb) => {
      async.waterfall(
        [
          (cb: ICallback<PurgeQueueJobManager>) => {
            const purgeQueueJobManager = new PurgeQueueJobManager(
              client,
              this.logger,
            );
            purgeQueueJobManager.initialize((err) => {
              if (err) return cb(err);
              cb(null, purgeQueueJobManager);
            });
          },
          operation,
        ],
        cb,
      );
    }, cb);
  }

  /**
   * Computes pagination parameters for a given page.
   */
  protected getPaginationParams(
    page: number,
    totalItems: number,
    pageSize: number,
  ): IBrowserPageInfo {
    // Ensure valid inputs
    if (pageSize <= 0) pageSize = 10;
    if (page < 1) page = 1;

    // Handle edge case: no items
    if (totalItems <= 0) {
      return {
        offsetStart: 0,
        offsetEnd: -1, // Redis convention: -1 means "no items"
        currentPage: 1,
        totalPages: 1,
        pageSize,
      };
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.min(page, totalPages);

    // Calculate Redis-style inclusive range
    const offsetStart = (currentPage - 1) * pageSize;
    const offsetEnd = Math.min(offsetStart + pageSize, totalItems) - 1;

    return {
      offsetStart,
      offsetEnd,
      currentPage,
      totalPages,
      pageSize,
    };
  }

  /**
   * Computes the total number of pages based on the provided page size and total items.
   */
  protected getTotalPages(pageSize: number, totalItems: number): number {
    if (pageSize <= 0 || totalItems === 0) {
      return 1;
    }
    return Math.ceil(totalItems / pageSize);
  }

  /**
   * Purges all messages from the specified queue.
   *
   * This operation is performed asynchronously using a background job. When this method
   * is called, it immediately creates and starts a purge job, and returns the ID of
   * that job. You can use the returned job ID to track the progress of the purge operation.
   *
   * @param {TQueueExtendedParams} queue - The queue to purge.
   * @param {Function} cb - Callback function that receives the job ID.
   */
  purge(queue: TQueueExtendedParams, cb: ICallback<string>): void {
    async.waterfall(
      [
        // Step 1: Validate queue operation
        (cb: ICallback<IQueueParsedParams>) => {
          this.withValidatedQueue(
            queue,
            (parsedParams, cb) => {
              QueueOperationValidator.validateOperation(
                parsedParams.queueParams,
                EQueueOperation.PURGE,
                (err) => {
                  if (err) return cb(err);
                  cb(null, parsedParams);
                },
              );
            },
            cb,
          );
        },

        // Step 2: Create purge job (handles locking automatically)
        (parsedParams: IQueueParsedParams, cb: ICallback<string>) => {
          this.logger.info(
            `Creating purge job for queue ${parsedParams.queueParams.name}`,
          );

          this.withPurgeQueueJobManager((purgeQueueJobManager, cb) => {
            const target: TPurgeQueueJobTarget = {
              queue: parsedParams,
              messageType: this.messageType,
            };

            purgeQueueJobManager.create(target, {}, (err, job) => {
              cb(err, job?.id);
            });
          }, cb);
        },
      ],
      cb,
    );
  }

  /**
   * Retrieves comprehensive details about a specific purge job.
   *
   * @param {TQueueExtendedParams} queue - The queue associated with the purge job.
   * @param {string} jobId - The ID of the purge job to retrieve.
   * @param {ICallback<IBackgroundJob<TPurgeQueueJobTarget>>} cb - Callback with the job object.
   */
  getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
  ): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, cb) => {
        this.logger.info(
          `Getting purge job ${jobId} for queue ${parsedParams.queueParams.name}`,
        );

        this.withPurgeQueueJobManager((purgeQueueJobManager, cb) => {
          purgeQueueJobManager.get(jobId, (err, job) => {
            if (err) return cb(err);
            if (!job) return cb(new CallbackEmptyReplyError());

            // Verify this job belongs to this queue and message type
            if (
              job.target.queue.queueParams.name !==
                parsedParams.queueParams.name ||
              job.target.queue.queueParams.ns !== parsedParams.queueParams.ns ||
              job.target.queue.groupId !== parsedParams.groupId ||
              job.target.messageType !== this.messageType
            ) {
              return cb(
                new InvalidPurgeQueueJobIdError({ metadata: { jobId } }),
              );
            }
            cb(null, job);
          });
        }, cb);
      },
      cb,
    );
  }

  /**
   * Retrieves the current status of a purge job.
   *
   * @param {TQueueExtendedParams} queue - The queue where the purge job is running.
   * @param {string} jobId - The ID of the purge job to check.
   * @param {ICallback<EBackgroundJobStatus>} cb - Callback with the job status.
   */
  getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<EBackgroundJobStatus>,
  ): void {
    this.getPurgeJob(queue, jobId, (err, job) => {
      if (err) return cb(err);
      if (!job) return cb(new CallbackEmptyReplyError());
      cb(null, job.status);
    });
  }

  /**
   * Cancels an active purge job that is currently in progress.
   *
   * @param {TQueueExtendedParams} queue - The queue where the purge job is running.
   * @param {string} jobId - The ID of the purge job to cancel.
   * @param {ICallback<void>} cb - Callback when cancellation is processed.
   */
  cancelPurge(queue: TQueueExtendedParams, jobId: string, cb: ICallback): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, cb) => {
        this.withPurgeQueueJobManager((purgeQueueJobManager, cb) => {
          purgeQueueJobManager.getActiveJob(
            {
              queue: parsedParams,
              messageType: this.messageType,
            },
            (err, activeJob) => {
              if (err) return cb(err);
              if (!activeJob || activeJob.id !== jobId) {
                return cb(
                  new InvalidPurgeQueueJobIdError({ metadata: { jobId } }),
                );
              }

              purgeQueueJobManager.cancel(jobId, (err) => cb(err));
            },
          );
        }, cb);
      },
      cb,
    );
  }

  /**
   * Retrieves detailed messages for a specific page.
   *
   * @param queue - Extended queue parameters
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @param cb - Callback returning an IQueueMessagesPage of IMessageTransferable
   */
  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, cb) => {
        this.logger.debug(
          `Getting messages for ${parsedParams.queueParams.name}, page ${page}, size ${pageSize}`,
        );

        async.waterfall(
          [
            (next: ICallback<IBrowserPage<string>>) => {
              this.getMessageIds(parsedParams, page, pageSize, next);
            },
            (
              pageResult: IBrowserPage<string>,
              next: ICallback<IBrowserPage<IMessageTransferable>>,
            ) => {
              if (pageResult.items.length === 0) {
                return next(null, { ...pageResult, items: [] });
              }

              this.messageManager.getMessagesByIds(
                pageResult.items,
                (err, messages) => {
                  if (err) return next(err);
                  next(null, { ...pageResult, items: messages ?? [] });
                },
              );
            },
          ],
          cb,
        );
      },
      cb,
    );
  }

  /**
   * Counts the total number of messages in the queue.
   *
   * @param queue - Extended queue parameters
   * @param cb - Callback returning the count
   */
  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, cb) => {
        this.logger.debug(
          `Counting messages for ${parsedParams.queueParams.name}`,
        );

        const keys = redisKeys.getQueueKeys(
          parsedParams.queueParams.ns,
          parsedParams.queueParams.name,
          parsedParams.groupId,
        );
        const keyVal = keys[this.redisKey];

        this.messageStorage.count(keyVal, (err, count) => {
          if (err) {
            this.logger.error(`Error counting messages: ${err.message}`);
            return cb(err);
          }

          this.logger.debug(
            `Queue ${parsedParams.queueParams.name} has ${count} messages`,
          );
          cb(null, count);
        });
      },
      cb,
    );
  }

  /**
   * Retrieves message IDs for a specific page.
   *
   * @param queue - Parsed queue parameters
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @param cb - Callback returning an IQueueMessagesPage of message IDs
   */
  getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters: ${parsedParams.message}`,
      );
      return cb(parsedParams);
    }

    this.logger.debug(
      `Getting message IDs for ${parsedParams.queueParams.name}, page ${page}, size ${pageSize}`,
    );

    const keys = redisKeys.getQueueKeys(
      parsedParams.queueParams.ns,
      parsedParams.queueParams.name,
      parsedParams.groupId,
    );
    const keyVal = keys[this.redisKey];

    async.waterfall(
      [
        (next: ICallback<number>) => {
          this.messageStorage.count(keyVal, next);
        },
        (totalItems: number, next: ICallback<IBrowserPage<string>>) => {
          if (totalItems === 0) {
            return next(null, { totalItems, items: [] });
          }

          const pageInfo = this.getPaginationParams(page, totalItems, pageSize);

          this.messageStorage.fetchItems(
            keyVal,
            {
              page: pageInfo.currentPage,
              pageSize: pageInfo.pageSize,
              offsetStart: pageInfo.offsetStart,
              offsetEnd: pageInfo.offsetEnd,
            },
            (err, items) => {
              if (err) return next(err);
              next(null, {
                totalItems,
                items: items ?? [],
              });
            },
          );
        },
      ],
      (err, result) => {
        if (err) {
          this.logger.error(`Error in getMessageIds: ${err.message}`);
        }
        cb(err, result);
      },
    );
  }
}
