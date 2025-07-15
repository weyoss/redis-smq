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
  logger,
  withRedisClient,
} from 'redis-smq-common';
import { RedisClient } from '../common/redis-client/redis-client.js';
import { Configuration } from '../config/index.js';
import { _deleteMessage } from './_/_delete-message.js';
import { _getMessageState } from './_/_get-message-state.js';
import { _getMessageStatus } from './_/_get-message-status.js';
import { _getMessage, _getMessages } from './_/_get-message.js';
import { _requeueMessage } from './_/_requeue-message.js';
import {
  EMessagePropertyStatus,
  IMessageDeleteResponse,
  IMessageStateTransferable,
  IMessageTransferable,
} from './types/index.js';

/**
 * The Message class provides methods for interacting with Redis-SMQ messages.
 * It utilizes the RedisClient to perform operations on Redis.
 */
export class Message {
  protected logger;
  protected redisClient;

  constructor() {
    const config = Configuration.getSetConfig();
    this.logger = logger.getLogger(
      config.logger,
      this.constructor.name.toLowerCase(),
    );
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.logger.error(err));
    this.logger.debug('Message instance created');
  }

  /**
   * Retrieves the status of a message with the given ID.
   *
   * @param messageId - The ID of the message to retrieve the status for.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be the status of the message.
   */
  getMessageStatus(
    messageId: string,
    cb: ICallback<EMessagePropertyStatus>,
  ): void {
    this.logger.debug('Getting message status', { messageId });
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        _getMessageStatus(client, messageId, (err, status) => {
          if (err) {
            this.logger.error('Failed to get message status', {
              messageId,
              error: err.message,
            });
            cb(err);
          } else {
            this.logger.debug('Successfully retrieved message status', {
              messageId,
              status,
            });
            cb(null, status);
          }
        });
      },
      cb,
    );
  }

  /**
   * Retrieves the state of a message with the given ID.
   *
   * @param messageId - The ID of the message to retrieve the state for.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be the state of the message.
   */
  getMessageState(
    messageId: string,
    cb: ICallback<IMessageStateTransferable>,
  ): void {
    this.logger.debug('Getting message state', { messageId });
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        _getMessageState(client, messageId, (err, state) => {
          if (err) {
            this.logger.error('Failed to get message state', {
              messageId,
              error: err.message,
            });
            cb(err);
          } else {
            this.logger.debug('Successfully retrieved message state', {
              messageId,
            });
            cb(null, state?.toJSON());
          }
        });
      },
      cb,
    );
  }

  /**
   * Retrieves messages with the given IDs.
   *
   * @param messageIds - An array of IDs of the messages to retrieve.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be an array of message objects.
   */
  getMessagesByIds(
    messageIds: string[],
    cb: ICallback<IMessageTransferable[]>,
  ): void {
    this.logger.debug('Getting messages by IDs', {
      messageCount: messageIds.length,
    });
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        _getMessages(client, messageIds, (err, reply) => {
          if (err) {
            this.logger.error('Failed to get messages', { error: err.message });
            cb(err);
          } else if (!reply) {
            this.logger.error('Empty messages reply');
            cb(new CallbackEmptyReplyError());
          } else {
            this.logger.debug('Successfully retrieved messages', {
              messageCount: reply.length,
            });
            cb(
              null,
              reply.map((i) => i.transfer()),
            );
          }
        });
      },
      cb,
    );
  }

  /**
   * Retrieves a message with the given ID.
   *
   * @param messageId - The ID of the message to retrieve.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be the message object.
   */
  getMessageById(messageId: string, cb: ICallback<IMessageTransferable>): void {
    this.logger.debug('Getting message by ID', { messageId });
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        _getMessage(client, messageId, (err, reply) => {
          if (err) {
            this.logger.error('Failed to get message', {
              messageId,
              error: err.message,
            });
            cb(err);
          } else if (!reply) {
            this.logger.error('Empty message reply', { messageId });
            cb(new CallbackEmptyReplyError());
          } else {
            this.logger.debug('Successfully retrieved message', { messageId });
            cb(null, reply.transfer());
          }
        });
      },
      cb,
    );
  }

  /**
   * Deletes multiple messages by their IDs
   *
   * @param ids - Array of message IDs to delete
   * @param cb - Callback function that will be called with the deletion result
   *             If an error occurs, the first parameter will be an Error object
   *             Otherwise, the second parameter will contain the deletion response
   */
  deleteMessagesByIds(
    ids: string[],
    cb: ICallback<IMessageDeleteResponse>,
  ): void {
    this.logger.debug(`Deleting ${ids.length} messages by IDs`, {
      messageIds: ids,
    });
    withRedisClient<IMessageDeleteResponse>(
      this.redisClient,
      (client, cb) => {
        async.withCallback(
          (cb: ICallback<IMessageDeleteResponse>) =>
            _deleteMessage(client, ids, cb),
          (reply, cb) => {
            this.logger.debug('MessageList deletion completed', reply);
            cb(null, reply);
          },
          cb,
        );
      },
      (err, result) => {
        if (err) {
          this.logger.error('Failed to delete messages by IDs', {
            error: err.message,
            messageIds: ids,
          });
        }
        cb(err, result);
      },
    );
  }

  /**
   * Deletes a message with the given ID.
   *
   * @param id - The ID of the message to delete.
   * @param cb - A callback function that will be called with the result.
   *             If an error occurs, the first parameter will be an Error object.
   *             Otherwise, the second parameter will contain the deletion response.
   */
  deleteMessageById(id: string, cb: ICallback<IMessageDeleteResponse>): void {
    this.logger.debug('Deleting message by ID', { messageId: id });
    this.deleteMessagesByIds([id], (err, reply) => {
      if (err) {
        this.logger.error('Failed to delete message', {
          messageId: id,
          error: err.message,
        });
        cb(err);
      } else {
        this.logger.debug('Successfully deleted message', { messageId: id });
        cb(null, reply);
      }
    });
  }

  /**
   * Requeues a message with the given ID.
   * A requeued message is created as a new message. The old message is not deleted
   * but its state is updated to reflect that it has been requeued.
   *
   * @param messageId - The ID of the message to requeue.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              On success, the second parameter will be the ID of the new message.
   */
  requeueMessageById(messageId: string, cb: ICallback<string>): void {
    this.logger.debug('Requeuing message by ID', { messageId });
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        _requeueMessage(client, messageId, (err, newMessageId) => {
          if (err) {
            this.logger.error('Failed to requeue message', {
              messageId,
              error: err.message,
            });
            return cb(err);
          }
          if (!newMessageId) return cb(new CallbackEmptyReplyError());

          this.logger.debug(
            `Successfully requeued message ${messageId}. New message ID is ${newMessageId}`,
          );
          cb(null, newMessageId);
        });
      },
      cb,
    );
  }

  /**
   * Shuts down the Redis client and performs cleanup operations.
   *
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be undefined.
   */
  shutdown = (cb: ICallback<void>): void => {
    this.logger.debug('Shutting down Message instance');
    this.redisClient.shutdown((err) => {
      if (err) {
        this.logger.error('Error during shutdown', { error: err.message });
        cb(err);
      } else {
        this.logger.debug('Successfully shut down Message instance');
        cb();
      }
    });
  };
}
