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
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _deleteMessage } from '../../message/_/_delete-message.js';
import { IMessageTransferable, Message } from '../../message/index.js';
import { _parseQueueExtendedParams } from '../../queue/_/_parse-queue-extended-params.js';
import { IQueueParsedParams, TQueueExtendedParams } from '../../queue/index.js';
import { _validateQueueExtendedParams } from '../_/_validate-queue-extended-params.js';
import { QueueMessagesStorage } from '../queue-messages-storage/queue-messages-storage.js';
import {
  IQueueMessages,
  IQueueMessagesPage,
  IQueueMessagesPageParams,
} from '../types/index.js';

/**
 * Abstract base class for queue message management operations.
 * Provides common functionality for different types of queue message managers.
 */
export abstract class QueueMessagesManagerAbstract implements IQueueMessages {
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
    return { offsetStart, offsetEnd, currentPage, totalPages };
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
    async.waterfall(
      [
        // Step 1: Count total messages
        (next: ICallback<number>) =>
          this.messageStorage.count(queue, this.redisKey, next),

        // Step 2: Fetch messages for the requested page
        (totalItems: number, next: ICallback<IQueueMessagesPage<string>>) => {
          const { currentPage, offsetStart, offsetEnd, totalPages } =
            this.getPaginationParams(page, totalItems, pageSize);

          // Calculate next cursor for pagination
          const nextCursor = currentPage < totalPages ? currentPage + 1 : 0;

          // Return empty result if no items
          if (totalItems === 0) {
            return next(null, {
              cursor: nextCursor,
              totalItems,
              items: [],
            });
          }

          // Fetch items for the current page
          this.messageStorage.fetchItems(
            queue,
            this.redisKey,
            offsetStart,
            offsetEnd,
            (err, items) => {
              if (err) return next(err);

              next(null, {
                cursor: nextCursor,
                totalItems,
                items: items ?? [],
              });
            },
          );
        },
      ],
      cb,
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
    if (parsedParams instanceof Error) return cb(parsedParams);

    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());

      _validateQueueExtendedParams(
        client,
        parsedParams,
        this.requireGroupId,
        (err) => {
          if (err) return cb(err);
          this._purgeMessages(client, parsedParams, cb);
        },
      );
    });
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
    // Recursive function to process batches
    const purgeBatch = (cursor = '0'): void => {
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
              return next(null, String(nextCursor));
            }

            // Delete the batch of messages
            _deleteMessage(client, items, (err) => {
              if (err) return next(err);
              next(null, String(nextCursor));
            });
          },
        ],
        (err, nextCursor) => {
          if (err) return cb(err);

          // If there are more messages to process, continue with next batch
          if (nextCursor !== '0') {
            purgeBatch(String(nextCursor));
          } else {
            // All messages purged
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
    if (parsedParams instanceof Error) return cb(parsedParams);

    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());

      _validateQueueExtendedParams(
        client,
        parsedParams,
        this.requireGroupId,
        (err) => {
          if (err) return cb(err);

          // Get message IDs for the requested page
          this.getMessagesIds(
            parsedParams,
            page,
            pageSize,
            (err, pageResult) => {
              if (err) return cb(err);
              if (!pageResult) return cb(new CallbackEmptyReplyError());

              // If no messages on this page, return empty result
              if (pageResult.items.length === 0) {
                return cb(null, { ...pageResult, items: [] });
              }

              // Get detailed message objects for the IDs
              this.message.getMessagesByIds(
                pageResult.items,
                (err, messages) => {
                  if (err) return cb(err);
                  cb(null, { ...pageResult, items: messages ?? [] });
                },
              );
            },
          );
        },
      );
    });
  }

  /**
   * Counts the total number of messages in the queue.
   *
   * @param queue - Extended queue parameters
   * @param cb - Callback returning the count
   */
  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());

      const parsedParams = _parseQueueExtendedParams(queue);
      if (parsedParams instanceof Error) return cb(parsedParams);

      _validateQueueExtendedParams(
        client,
        parsedParams,
        this.requireGroupId,
        (err) => {
          if (err) return cb(err);
          this.messageStorage.count(parsedParams, this.redisKey, cb);
        },
      );
    });
  }

  /**
   * Shuts down the manager and its dependencies gracefully.
   *
   * @param cb - Callback function
   */
  shutdown(cb: ICallback<void>): void {
    async.waterfall(
      [
        // Step 1: Shutdown message handler
        (next: ICallback<void>) => this.message.shutdown(next),

        // Step 2: Shutdown Redis client
        (next: ICallback<void>) => this.redisClient.shutdown(next),
      ],
      cb,
    );
  }
}
