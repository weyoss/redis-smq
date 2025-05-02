/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  ICallback,
  IRedisClient,
  logger,
  withRedisClient,
} from 'redis-smq-common';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { _deleteMessage } from '../../message/_/_delete-message.js';
import { IMessageTransferable, Message } from '../../message/index.js';
import { _parseQueueExtendedParams } from '../../queue/_/_parse-queue-extended-params.js';
import { IQueueParsedParams, TQueueExtendedParams } from '../../queue/index.js';
import { _validateQueueExtendedParams } from '../_/_validate-queue-extended-params.js';
import { QueueMessagesStorage } from '../queue-messages-storage/queue-messages-storage.js';
import {
  IQueueMessageManager,
  IQueueMessagesPage,
  IQueueMessagesPageParams,
} from '../types/index.js';

/**
 * Abstract base class for queue message management operations.
 * Provides common functionality for different types of queue message managers.
 */
export abstract class QueueMessagesManagerAbstract
  implements IQueueMessageManager
{
  /**
   * Redis client instance for database operations.
   */
  protected readonly redisClient: RedisClient;

  /**
   * Message handler for retrieving detailed message information.
   */
  protected readonly message: Message;

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
  protected readonly messageStorage: QueueMessagesStorage;

  /**
   * Logger instance for logging operations.
   */
  protected readonly logger;

  protected constructor(
    redisClient: RedisClient,
    messagesStorage: QueueMessagesStorage,
    message: Message,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
  ) {
    this.redisClient = redisClient;
    this.messageStorage = messagesStorage;
    this.message = message;
    this.redisKey = redisKey;
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );

    // Log errors from Redis client
    this.redisClient.on('error', (err) => this.logger.error(err));
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
  ): IQueueMessagesPageParams {
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
    cb: ICallback<IQueueMessagesPage<string>>,
  ): void {
    this.logger.debug(
      `Getting message IDs for queue ${queue.queueParams.name}, page ${page}, size ${pageSize}`,
    );

    const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
    const keyVal = keys[this.redisKey];

    async.waterfall(
      [
        // Step 1: Count total messages
        (next: ICallback<number>) => {
          this.logger.debug(
            `Counting messages for queue ${queue.queueParams.name}`,
          );
          this.messageStorage.count(keyVal, next);
        },

        // Step 2: Fetch messages for the requested page
        (totalItems: number, next: ICallback<IQueueMessagesPage<string>>) => {
          this.logger.debug(
            `Found ${totalItems} total messages for queue ${queue.queueParams.name}`,
          );

          const { currentPage, offsetStart, offsetEnd, totalPages } =
            this.getPaginationParams(page, totalItems, pageSize);

          // Calculate next cursor for pagination
          const nextCursor = currentPage < totalPages ? currentPage + 1 : 0;

          // Return empty result if no items
          if (totalItems === 0) {
            this.logger.debug(
              `No messages found for queue ${queue.queueParams.name}`,
            );
            return next(null, {
              cursor: nextCursor,
              totalItems,
              items: [],
            });
          }

          // Fetch items for the current page
          this.logger.debug(
            `Fetching messages for queue ${queue.queueParams.name} from index ${offsetStart} to ${offsetEnd}`,
          );

          this.messageStorage.fetchItems(
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
                cursor: nextCursor,
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
   * Purges all messages from the queue.
   *
   * @param queue - Extended queue parameters
   * @param cb - Callback function
   */
  purge(queue: TQueueExtendedParams, cb: ICallback<void>): void {
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

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
      },
      cb,
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
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Starting batch purge for queue ${parsedParams.queueParams.name}`,
    );

    // Recursive function to process batches
    const purgeBatch = (cursor = '0'): void => {
      this.logger.debug(
        `Processing purge batch with cursor ${cursor} for queue ${parsedParams.queueParams.name}`,
      );

      async.waterfall(
        [
          // Step 1: Get batch of message IDs
          (next: ICallback<IQueueMessagesPage<string>>) => {
            this.getMessagesIds(parsedParams, Number(cursor), 1000, next);
          },

          // Step 2: Delete the messages and return next cursor
          (page: IQueueMessagesPage<string>, next: ICallback<string>) => {
            const { items, cursor: nextCursor } = page;

            // If no items, we're done with this batch
            if (items.length === 0) {
              this.logger.debug(
                `No messages to purge in this batch for queue ${parsedParams.queueParams.name}`,
              );
              return next(null, String(nextCursor));
            }

            this.logger.debug(
              `Deleting batch of ${items.length} messages from queue ${parsedParams.queueParams.name}`,
            );

            // Delete the batch of messages
            _deleteMessage(client, items, (err) => {
              if (err) {
                this.logger.error(`Error deleting messages: ${err.message}`);
                return next(err);
              }
              this.logger.debug(
                `Successfully deleted ${items.length} messages from queue ${parsedParams.queueParams.name}`,
              );
              next(null, String(nextCursor));
            });
          },
        ],
        (err, nextCursor) => {
          if (err) {
            this.logger.error(`Error in purge batch: ${err.message}`);
            return cb(err);
          }

          // If there are more messages to process, continue with next batch
          if (nextCursor !== '0') {
            this.logger.debug(
              `More messages to purge, continuing with cursor ${nextCursor} for queue ${parsedParams.queueParams.name}`,
            );
            purgeBatch(String(nextCursor));
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
    purgeBatch('0');
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
    cb: ICallback<IQueueMessagesPage<IMessageTransferable>>,
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

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
              (cb: ICallback<IQueueMessagesPage<string>>) =>
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
                this.message.getMessagesByIds(
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

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
              parsedParams.queueParams,
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
        );
      },
      cb,
    );
  }

  /**
   * Shuts down the manager and its dependencies gracefully.
   *
   * @param cb - Callback function
   */
  shutdown(cb: ICallback<void>): void {
    this.logger.info('Shutting down queue messages manager');

    async.series(
      [
        // Step 1: Shutdown message handler
        (next: ICallback<void>) => {
          this.logger.debug('Shutting down message handler');
          this.message.shutdown(next);
        },

        // Step 2: Shutdown Redis client
        (next: ICallback<void>) => {
          this.logger.debug('Shutting down Redis client');
          this.redisClient.shutdown(next);
        },
      ],
      (err) => {
        if (err) {
          this.logger.error(`Error during shutdown: ${err.message}`);
        } else {
          this.logger.info('Queue messages manager shutdown complete');
        }
        cb(err);
      },
    );
  }
}
