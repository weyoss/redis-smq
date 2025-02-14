/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback, logger } from 'redis-smq-common';
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { Configuration } from '../../config/index.js';
import { _deleteMessage } from './_/_delete-message.js';
import { _getMessageState } from './_/_get-message-state.js';
import { _getMessageStatus } from './_/_get-message-status.js';
import { _getMessage, _getMessages } from './_/_get-message.js';
import { _requeueMessage } from './_/_requeue-message.js';
import {
  EMessagePropertyStatus,
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
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `exchange-fan-out-manager`,
    );
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.logger.error(err));
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessageStatus(client, messageId, cb);
    });
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getMessageState(client, messageId, cb);
    });
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _getMessages(client, messageIds, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else {
            cb(
              null,
              reply.map((i) => i.transfer()),
            );
          }
        });
    });
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _getMessage(client, messageId, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else cb(null, reply.transfer());
        });
    });
  }

  /**
   * Deletes messages with the given IDs.
   *
   * @param ids - An array of IDs of the messages to delete.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be undefined.
   */
  deleteMessagesByIds(ids: string[], cb: ICallback<void>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _deleteMessage(client, ids, cb);
    });
  }

  /**
   * Deletes a message with the given ID.
   *
   * @param id - The ID of the message to delete.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be undefined.
   */
  deleteMessageById(id: string, cb: ICallback<void>): void {
    this.deleteMessagesByIds([id], cb);
  }

  /**
   * Requeues a message with the given ID.
   *
   * @param messageId - The ID of the message to requeue.
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be undefined.
   */
  requeueMessageById(messageId: string, cb: ICallback<void>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _requeueMessage(client, messageId, cb);
    });
  }

  /**
   * Shuts down the Redis client and performs cleanup operations.
   *
   * @param cb - A callback function that will be called with the result.
   *              If an error occurs, the first parameter will be an Error object.
   *              Otherwise, the second parameter will be undefined.
   */
  shutdown = (cb: ICallback<void>): void => {
    this.redisClient.shutdown(cb);
  };
}
