/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, createLogger, ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../redis/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { _deleteMessage } from '../../message-manager/_/_delete-message.js';
import { IMessageTransferable } from '../../message/index.js';
import { _parseQueueExtendedParams } from '../../queue-manager/_/_parse-queue-extended-params.js';
import {
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../../queue-manager/index.js';
import { _validateQueueExtendedParams } from './_/_validate-queue-extended-params.js';
import { BrowserStorageAbstract } from './browser-storage/browser-storage-abstract.js';
import {
  IBrowserPage,
  IBrowserPageInfo,
  IMessageBrowser,
} from './types/index.js';
import { MessageManager } from '../../message-manager/index.js';
import { withSharedPoolConnection } from '../redis/redis-connection-pool/with-shared-pool-connection.js';

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
   * Message manager for retrieving detailed message information.
   */
  protected readonly messageManager: MessageManager;

  /**
   * Flag indicating if a consumer group ID is required during validation.
   */
  protected requireGroupId: boolean = false;

  /**
   * Redis key for the message collection.
   * Subclasses must specify this to correctly target the underlying Redis key.
   */
  protected readonly redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>;

  /**
   * Storage manager for queue messages.
   */
  protected readonly storageAbstract: BrowserStorageAbstract;

  /**
   * Logger instance for logging operations.
   */
  protected readonly logger;

  protected constructor(
    messagesStorage: BrowserStorageAbstract,
    messageManager: MessageManager,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
  ) {
    this.storageAbstract = messagesStorage;
    this.messageManager = messageManager;
    this.redisKey = redisKey;
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
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
   *             Otherwise, the first parameter will be null/undefined.
   */
  purge(queue: TQueueExtendedParams, cb: ICallback): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters: ${parsedParams.message}`,
      );
      return cb(parsedParams);
    }

    this.logger.info(
      `Purging messages from queue ${parsedParams.queueParams.name}`,
    );

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
          this._purgeMessages(client, parsedParams, cb);
        },
      );
    }, cb);
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
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters: ${parsedParams.message}`,
      );
      return cb(parsedParams);
    }

    this.logger.debug(
      `Getting messages for queue ${parsedParams.queueParams.name}, page ${page}, size ${pageSize}`,
    );

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

          async.withCallback(
            // Get message IDs for the requested page
            (cb: ICallback<IBrowserPage<string>>) =>
              this.getMessagesIds(parsedParams, page, pageSize, cb),
            (pageResult, cb) => {
              // If no messages on this page, return empty result
              if (pageResult.items.length === 0) {
                this.logger.debug(
                  `No messages found for queue ${parsedParams.queueParams.name} on page ${page}`,
                );
                return cb(null, { ...pageResult, items: [] });
              }

              this.logger.debug(
                `Retrieving ${pageResult.items.length} message details for queue ${parsedParams.queueParams.name}`,
              );

              // Get detailed message objects for the IDs
              this.messageManager.getMessagesByIds(
                pageResult.items,
                (err, messages) => {
                  if (err) {
                    this.logger.error(
                      `Error getting message details: ${err.message}`,
                    );
                    return cb(err);
                  }
                  this.logger.debug(
                    `Successfully retrieved ${messages?.length || 0} message details for queue ${parsedParams.queueParams.name}`,
                  );
                  cb(null, { ...pageResult, items: messages ?? [] });
                },
              );
            },
            cb,
          );
        },
      );
    }, cb);
  }

  /**
   * Counts the total number of messages in the queue.
   *
   * @param queue - Extended queue parameters
   * @param cb - Callback returning the count
   */
  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters: ${parsedParams.message}`,
      );
      return cb(parsedParams);
    }

    this.logger.debug(
      `Counting messages for queue ${parsedParams.queueParams.name}`,
    );

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

          const keys = redisKeys.getQueueKeys(
            parsedParams.queueParams.ns,
            parsedParams.queueParams.name,
            parsedParams.groupId,
          );
          const keyVal = keys[this.redisKey];

          this.storageAbstract.count(keyVal, (err, count) => {
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
      );
    }, cb);
  }

  /**
   * Computes the total number of pages based on the provided page size and total items.
   *
   * @param pageSize - Number of items per page
   * @param totalItems - Total number of items
   * @returns The total number of pages (at least 1)
   */
  protected getTotalPages(pageSize: number, totalItems: number): number {
    if (pageSize <= 0) {
      return 1;
    }
    const totalPages = Math.ceil(totalItems / pageSize);
    return totalPages > 0 ? totalPages : 1;
  }

  /**
   * Computes pagination parameters for a given page.
   *
   * @param cursor - Desired page number (1-based)
   * @param totalItems - Total number of items
   * @param pageSize - Number of items per page
   * @returns An object with offsetStart, offsetEnd, currentPage, and totalPages
   */
  protected getPaginationParams(
    cursor: number,
    totalItems: number,
    pageSize: number,
  ): IBrowserPageInfo {
    const totalPages = this.getTotalPages(pageSize, totalItems);
    const currentPage = cursor < 1 || cursor > totalPages ? 1 : cursor;
    const offsetStart = (currentPage - 1) * pageSize;
    const offsetEnd = offsetStart + pageSize - 1;
    return { offsetStart, offsetEnd, currentPage, totalPages, pageSize };
  }

  /**
   * Retrieves message IDs for a specific page.
   *
   * @param queue - Parsed queue parameters
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @param cb - Callback returning an IQueueMessagesPage of message IDs
   */
  protected getMessagesIds(
    queue: IQueueParsedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void {
    this.logger.debug(
      `Getting message IDs for queue ${queue.queueParams.name}, page ${page}, size ${pageSize}`,
    );

    const keys = redisKeys.getQueueKeys(
      queue.queueParams.ns,
      queue.queueParams.name,
      queue.groupId,
    );
    const keyVal = keys[this.redisKey];

    async.waterfall(
      [
        // Step 1: Count total messages
        (next: ICallback<number>) => {
          this.logger.debug(
            `Counting messages for queue ${queue.queueParams.name}`,
          );
          this.storageAbstract.count(keyVal, next);
        },

        // Step 2: Fetch messages for the requested page
        (totalItems: number, next: ICallback<IBrowserPage<string>>) => {
          this.logger.debug(
            `Found ${totalItems} total messages for queue ${queue.queueParams.name}`,
          );

          const { currentPage, offsetStart, offsetEnd } =
            this.getPaginationParams(page, totalItems, pageSize);

          // Return empty result if no items
          if (totalItems === 0) {
            this.logger.debug(
              `No messages found for queue ${queue.queueParams.name}`,
            );
            return next(null, {
              totalItems,
              items: [],
            });
          }

          // Fetch items for the current page
          this.logger.debug(
            `Fetching messages for queue ${queue.queueParams.name} from index ${offsetStart} to ${offsetEnd}`,
          );

          this.storageAbstract.fetchItems(
            keyVal,
            { page: currentPage, pageSize, offsetStart, offsetEnd },
            (err, items) => {
              if (err) {
                this.logger.error(`Error fetching messages: ${err.message}`);
                return next(err);
              }

              this.logger.debug(
                `Retrieved ${items?.length || 0} messages for queue ${queue.queueParams.name}`,
              );

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
          this.logger.error(`Error in getMessagesIds: ${err.message}`);
        }
        cb(err, result);
      },
    );
  }

  /**
   * Internal method to purge messages in batches.
   *
   * @param client - Redis client instance
   * @param parsedParams - Validated queue parameters
   * @param cb - Callback function
   */
  protected _purgeMessages(
    client: IRedisClient,
    parsedParams: IQueueParsedParams,
    cb: ICallback,
  ): void {
    this.logger.debug(
      `Starting batch purge for queue ${parsedParams.queueParams.name}`,
    );

    // Batch size
    const pageSize = 1000;

    // Recursive function to process batches
    const purgeBatch = (page = 1): void => {
      this.logger.debug(
        `Processing purge batch with page ${page} / ${pageSize} for queue ${parsedParams.queueParams.name}`,
      );

      async.waterfall(
        [
          // Step 1: Get batch of message IDs
          (next: ICallback<IBrowserPage<string>>) => {
            this.getMessagesIds(parsedParams, page, pageSize, next);
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
            _deleteMessage(client, items, (err, reply) => {
              if (err) {
                this.logger.error(`Error deleting messages: ${err.message}`);
                return next(err);
              }
              this.logger.debug('MessageList deletion completed', reply);
              next(null, page + 1);
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
            purgeBatch(nextPage);
          } else {
            // All messages purged
            this.logger.info(
              `Successfully purged all messages from queue ${parsedParams.queueParams.name}`,
            );
            cb();
          }
        },
      );
    };

    // Start purging from the first batch
    purgeBatch(1);
  }
}
