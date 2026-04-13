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
} from 'redis-smq-common';
import { Configuration } from '../config-manager/configuration.js';
import { _deleteMessage } from './_/_delete-message.js';
import { _getMessageState } from './_/_get-message-state.js';
import { _getMessageStatus } from './_/_get-message-status.js';
import { _getMessage, _getMessages } from './_/_get-message.js';
import { _requeueMessage } from './_/_requeue-message.js';
import {
  EMessagePropertyStatus,
  IMessageStateTransferable,
  IMessageTransferable,
} from '../message/index.js';
import { IMessageManagerDeleteResponse } from './types/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { TMessageUnacknowledgementHistory } from '../consumer/index.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import {
  MessageNotFoundError,
  UnacknowledgmentHistoryDisabledError,
} from '../errors/index.js';

/**
 * Manages individual message operations.
 *
 * Provides methods to get, delete, and requeue messages by ID,
 * plus status and state inspection.
 *
 * @example
 * const messageManager = new MessageManager();
 *
 * // Get message status
 * const status = await messageManager.getMessageStatus('msg-123');
 *
 * // Requeue a message
 * const newId = await messageManager.requeueMessageById('msg-123');
 */
export class MessageManager {
  protected logger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(config.logger, this.constructor.name);
  }

  /**
   * Gets the status of a message.
   *
   * @param messageId - Message ID
   * @param cb - (err, status) => void. Returns EMessagePropertyStatus
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const status = await messageManager.getMessageStatus('msg-123');
   *
   * // Callback
   * messageManager.getMessageStatus('msg-123', (err, status) => {
   *   if (err) throw err;
   *   console.log(status);
   * });
   */
  getMessageStatus(messageId: string): Promise<EMessagePropertyStatus>;
  getMessageStatus(
    messageId: string,
    cb: ICallback<EMessagePropertyStatus>,
  ): void;
  getMessageStatus(
    messageId: string,
    cb?: ICallback<EMessagePropertyStatus>,
  ): Promise<EMessagePropertyStatus> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting message status', { messageId });
      withSharedPoolConnection((client, cb) => {
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
      }, callback);
    });
  }

  /**
   * Gets the state of a message (timestamps, attempts, etc.).
   *
   * @param messageId - Message ID
   * @param cb - (err, state) => void. Returns IMessageStateTransferable
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const state = await messageManager.getMessageState('msg-123');
   * console.log(state.attempts);
   *
   * // Callback
   * messageManager.getMessageState('msg-123', (err, state) => {
   *   if (err) throw err;
   *   console.log(state);
   * });
   */
  getMessageState(messageId: string): Promise<IMessageStateTransferable>;
  getMessageState(
    messageId: string,
    cb: ICallback<IMessageStateTransferable>,
  ): void;
  getMessageState(
    messageId: string,
    cb?: ICallback<IMessageStateTransferable>,
  ): Promise<IMessageStateTransferable> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting message state', { messageId });
      withSharedPoolConnection((client, cb) => {
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
      }, callback);
    });
  }

  /**
   * Gets multiple messages by their IDs.
   *
   * @param messageIds - Array of message IDs
   * @param cb - (err, messages) => void. Returns IMessageTransferable[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const messages = await messageManager.getMessagesByIds(['msg-1', 'msg-2']);
   *
   * // Callback
   * messageManager.getMessagesByIds(['msg-1', 'msg-2'], (err, messages) => {
   *   if (err) throw err;
   *   console.log(messages.length);
   * });
   */
  getMessagesByIds(messageIds: string[]): Promise<IMessageTransferable[]>;
  getMessagesByIds(
    messageIds: string[],
    cb: ICallback<IMessageTransferable[]>,
  ): void;
  getMessagesByIds(
    messageIds: string[],
    cb?: ICallback<IMessageTransferable[]>,
  ): Promise<IMessageTransferable[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting messages by IDs', {
        messageCount: messageIds.length,
      });
      withSharedPoolConnection((client, cb) => {
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
      }, callback);
    });
  }

  /**
   * Gets a single message by its ID.
   *
   * @param messageId - Message ID
   * @param cb - (err, message) => void. Returns IMessageTransferable
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const message = await messageManager.getMessageById('msg-123');
   * console.log(message.getBody());
   *
   * // Callback
   * messageManager.getMessageById('msg-123', (err, message) => {
   *   if (err) throw err;
   *   console.log(message);
   * });
   */
  getMessageById(messageId: string): Promise<IMessageTransferable>;
  getMessageById(messageId: string, cb: ICallback<IMessageTransferable>): void;
  getMessageById(
    messageId: string,
    cb?: ICallback<IMessageTransferable>,
  ): Promise<IMessageTransferable> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting message by ID', { messageId });
      withSharedPoolConnection((client, cb) => {
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
      }, callback);
    });
  }

  /**
   * Deletes multiple messages by their IDs.
   *
   * @param ids - Array of message IDs
   * @param cb - (err, response) => void. Returns IMessageManagerDeleteResponse
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const result = await messageManager.deleteMessagesByIds(['msg-1', 'msg-2']);
   * console.log(`Deleted: ${result.deletedCount}`);
   *
   * // Callback
   * messageManager.deleteMessagesByIds(['msg-1', 'msg-2'], (err, result) => {
   *   if (err) throw err;
   *   console.log(result);
   * });
   */
  deleteMessagesByIds(ids: string[]): Promise<IMessageManagerDeleteResponse>;
  deleteMessagesByIds(
    ids: string[],
    cb: ICallback<IMessageManagerDeleteResponse>,
  ): void;
  deleteMessagesByIds(
    ids: string[],
    cb?: ICallback<IMessageManagerDeleteResponse>,
  ): Promise<IMessageManagerDeleteResponse> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug(`Deleting ${ids.length} messages by IDs`, {
        messageIds: ids,
      });
      withSharedPoolConnection<IMessageManagerDeleteResponse>(
        (client, cb) => {
          async.withCallback(
            (cb: ICallback<IMessageManagerDeleteResponse>) =>
              _deleteMessage(client, ids, null, cb),
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
          callback(err, result);
        },
      );
    });
  }

  /**
   * Deletes a single message by its ID.
   *
   * @param id - Message ID
   * @param cb - (err, response) => void. Returns IMessageManagerDeleteResponse
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const result = await messageManager.deleteMessageById('msg-123');
   *
   * // Callback
   * messageManager.deleteMessageById('msg-123', (err, result) => {
   *   if (err) throw err;
   *   console.log(result);
   * });
   */
  deleteMessageById(id: string): Promise<IMessageManagerDeleteResponse>;
  deleteMessageById(
    id: string,
    cb: ICallback<IMessageManagerDeleteResponse>,
  ): void;
  deleteMessageById(
    id: string,
    cb?: ICallback<IMessageManagerDeleteResponse>,
  ): Promise<IMessageManagerDeleteResponse> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Deleting message by ID', { messageId: id });
      this.deleteMessagesByIds([id], (err, reply) => {
        if (err) {
          this.logger.error('Failed to delete message', {
            messageId: id,
            error: err.message,
          });
          callback(err);
        } else {
          this.logger.debug('Successfully deleted message', { messageId: id });
          callback(null, reply);
        }
      });
    });
  }

  /**
   * Requeues a message (creates a new copy for reprocessing).
   *
   * @param messageId - Message ID to requeue
   * @param cb - (err, newMessageId) => void. Returns string
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const newId = await messageManager.requeueMessageById('msg-123');
   *
   * // Callback
   * messageManager.requeueMessageById('msg-123', (err, newId) => {
   *   if (err) throw err;
   *   console.log(newId);
   * });
   */
  requeueMessageById(messageId: string): Promise<string>;
  requeueMessageById(messageId: string, cb: ICallback<string>): void;
  requeueMessageById(
    messageId: string,
    cb?: ICallback<string>,
  ): Promise<string> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Requeuing message by ID', { messageId });
      withSharedPoolConnection((client, cb) => {
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
      }, callback);
    });
  }

  /**
   * Gets the unacknowledgement history for a message.
   *
   * Requires message audit to be enabled in configuration.
   *
   * @param messageId - Message ID
   * @param cb - (err, history) => void. Returns TMessageUnacknowledgementHistory
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const history = await messageManager.getMessageUnacknowledgementHistory('msg-123');
   * console.log(history.length);
   *
   * // Callback
   * messageManager.getMessageUnacknowledgementHistory('msg-123', (err, history) => {
   *   if (err) throw err;
   *   console.log(history);
   * });
   */
  getMessageUnacknowledgementHistory(
    messageId: string,
  ): Promise<TMessageUnacknowledgementHistory>;
  getMessageUnacknowledgementHistory(
    messageId: string,
    cb: ICallback<TMessageUnacknowledgementHistory>,
  ): void;
  getMessageUnacknowledgementHistory(
    messageId: string,
    cb?: ICallback<TMessageUnacknowledgementHistory>,
  ): Promise<TMessageUnacknowledgementHistory> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting message unacknowledgement history', messageId);

      if (
        !Configuration.getConfig().messageAudit.unacknowledgementHistory.enabled
      ) {
        this.logger.debug('Message unacknowledgement history is disabled');
        return callback(new UnacknowledgmentHistoryDisabledError());
      }

      const { keyMessage, keyMessageUnacknowledgementHistory } =
        redisKeys.getMessageKeys(messageId);
      withSharedPoolConnection((client, done) => {
        async.waterfall(
          [
            (cb) => {
              client.exists(keyMessage, (err, exists) => {
                if (err) {
                  this.logger.error('Failed to check message existence', {
                    messageId,
                    error: err.message,
                  });
                  return cb(err);
                }
                if (!exists) return cb(new MessageNotFoundError());
                cb();
              });
            },
            (_, cb) => {
              client.lrange(
                keyMessageUnacknowledgementHistory,
                0,
                -1,
                (err, records) => {
                  if (err) {
                    this.logger.error('Failed to get message history', {
                      messageId,
                      error: err.message,
                    });
                    return cb(err);
                  }

                  const history: TMessageUnacknowledgementHistory =
                    records?.map((record) => JSON.parse(record)) || [];
                  this.logger.debug('Successfully retrieved message history', {
                    messageId,
                    recordCount: history.length,
                  });
                  cb(null, history);
                },
              );
            },
          ],
          done,
        );
      }, callback);
    });
  }
}
