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
import { PurgeQueueJobManager } from '../background-job/purge-queue-job-manager.js';
import { InvalidPurgeQueueJobIdError } from '../../errors/index.js';
import { IBrowserStorage } from './browser-storage/browser-storage-abstract.js';
import { EQueueMessageType } from '../queue-messages-registry/types/queue-messages-registry.js';
import { Configuration } from '../../config/index.js';

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
   * Purges all messages from the specified queue.
   *
   * Different message types can be purged using specific classes:
   * - {@link QueueMessages} - Delete all queue messages
   * - {@link QueueAcknowledgedMessages} - Delete acknowledged messages (if configured to be stored)
   * - {@link QueueDeadLetteredMessages} - Delete dead-lettered messages (if configured to be stored)
   * - {@link QueueScheduledMessages} - Delete scheduled messages
   * - {@link QueuePendingMessages} - Delete pending messages
   *
   * @param queue - The queue to purge. Can be a string, queue parameters object,
   *                or queue consumer group parameters.
   * @param cb - Callback function that will be invoked when the operation completes.
   *             If an error occurs, the first parameter will contain the Error object.
   *             Otherwise, the first parameter will be the ID of the job created for purging queue messages.
   *
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
   */
  purge(queue: TQueueExtendedParams, cb: ICallback<string>): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, cb) => {
        this.logger.info(
          `Creating purge job for queue ${parsedParams.queueParams.name}`,
        );

        withSharedPoolConnection((client, cb) => {
          const purgeQueueJobManager = new PurgeQueueJobManager(
            client,
            this.logger,
          );
          purgeQueueJobManager.create(
            {
              queue: parsedParams,
              messageType: this.messageType,
            },
            {},
            (err, jobId) => {
              if (err) return cb(err);
              if (!jobId) return cb(new CallbackEmptyReplyError());

              this.logger.info(
                `Created purge job ${jobId} for queue ${parsedParams.queueParams.name}`,
              );
              cb(null, jobId);
            },
          );
        }, cb);
      },
      cb,
    );
  }

  /**
   * Cancels an active purge job.
   */
  cancelPurge(queue: TQueueExtendedParams, jobId: string, cb: ICallback): void {
    this.withValidatedQueue(
      queue,
      (parsedParams, cb) => {
        this.logger.info(
          `Canceling purge job ${jobId} for queue ${parsedParams.queueParams.name}`,
        );

        withSharedPoolConnection((client, cb) => {
          const purgeQueueJobManager = new PurgeQueueJobManager(
            client,
            this.logger,
          );

          purgeQueueJobManager.getActiveJob(
            {
              queue: parsedParams,
              messageType: this.messageType,
            },
            (err, reply) => {
              if (err) return cb(err);
              if (!reply) {
                this.logger.error(
                  `No active purge job found for queue ${parsedParams.queueParams.name}`,
                );
                return cb(
                  new InvalidPurgeQueueJobIdError({ metadata: { jobId } }),
                );
              }

              if (reply.id !== jobId) {
                this.logger.error(
                  `Active job mismatch: expected ${jobId}, found ${reply.id}`,
                );
                return cb(
                  new InvalidPurgeQueueJobIdError({ metadata: { jobId } }),
                );
              }

              purgeQueueJobManager.cancel(jobId, cb);
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
   *
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
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
   *
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
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

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.min(page, totalPages || 1);

    // Calculate offsets
    const offsetStart = (currentPage - 1) * pageSize;
    const offsetEnd = Math.min(offsetStart + pageSize - 1, totalItems - 1);

    return {
      offsetStart: Math.max(0, offsetStart),
      offsetEnd: Math.max(0, offsetEnd),
      currentPage,
      totalPages: Math.max(1, totalPages),
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
}
