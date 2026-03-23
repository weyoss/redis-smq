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
import { Configuration } from '../config/index.js';
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

/**
 * The MessageManager class provides methods for interacting with Redis-SMQ messages.
 * It utilizes the RedisClient to perform operations on Redis.
 *
 * This class allows you to inspect, modify, and manage individual messages
 * across the system, regardless of their current state or queue location.
 *
 * @example
 * ```typescript
 * const messageManager = new MessageManager();
 *
 * // Using callback
 * messageManager.getMessageStatus('msg-123', (err, status) => {
 *   if (err) {
 *     console.error('Failed to get message status:', err);
 *   } else {
 *     console.log('Message status:', status);
 *   }
 * });
 *
 * // Using promise
 * const status = await messageManager.getMessageStatus('msg-123');
 * console.log('Message status:', status);
 * ```
 */
export class MessageManager {
  protected logger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(config.logger, this.constructor.name);
  }

  /**
   * Retrieves the status of a message with the given ID.
   *
   * @param messageId - The ID of the message to retrieve the status for
   * @param cb - Optional callback function that will be called with the result.
   *             - On success: `cb(null, status)` where status is the message status enum.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the status.
   * @returns {Promise<EMessagePropertyStatus> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {MessageNotFoundError} When the message with the given ID doesn't exist.
   *
   * @example
   * ```typescript
   * const messageManager = new MessageManager();
   *
   * // Callback pattern
   * messageManager.getMessageStatus('msg-123', (err, status) => {
   *   if (err) {
   *     console.error('Message not found or error:', err);
   *   } else {
   *     // ...
   *   }
   * });
   *
   * // Promise pattern
   * async function isMessageProcessed(messageId: string): Promise<boolean> {
   *   try {
   *     const status = await messageManager.getMessageStatus(messageId);
   *     return status === EMessagePropertyStatus.ACKNOWLEDGED;
   *   } catch (err) {
   *     console.error('Failed to check message status:', err);
   *     return false;
   *   }
   * }
   * ```
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
   * Retrieves the state of a message with the given ID.
   *
   * @param messageId - The ID of the message to retrieve the state for
   * @param cb - Optional callback function that will be called with the result.
   *             - On success: `cb(null, state)` where state contains detailed message metadata.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the state.
   * @returns {Promise<IMessageStateTransferable> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {MessageNotFoundError} When the message with the given ID doesn't exist.
   *
   * @example
   * ```typescript
   * const messageManager = new MessageManager();
   *
   * // Callback pattern
   * messageManager.getMessageState('msg-123', (err, state) => {
   *   if (err) {
   *     console.error('Failed to get message state:', err);
   *   } else {
   *     // ...
   *   }
   * });
   *
   * // Promise pattern
   * async function analyzeMessageProcessing(messageId: string) {
   *   try {
   *     const state = await messageManager.getMessageState(messageId);
   *     // ...
   *   } catch (err) {
   *     console.error('Failed to analyze message:', err);
   *   }
   * }
   * ```
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
   * Retrieves multiple messages by their IDs.
   *
   * This method returns full message objects for multiple message IDs in a single
   * operation, which is more efficient than calling `getMessageById` for each ID.
   *
   * @param messageIds - An array of IDs of the messages to retrieve
   * @param cb - Optional callback function that will be called with the result.
   *             - On success: `cb(null, messages)` where messages is an array of message objects.
   *             - On error: `cb(error)` with any Redis or system errors.
   *             - If not provided, the method returns a Promise that resolves with the messages.
   * @returns {Promise<IMessageTransferable[]> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {MessageNotFoundError} When any of the messages don't exist (in strict mode).
   *
   * @example
   * ```typescript
   * const messageManager = new MessageManager();
   *
   * // Callback pattern
   * messageManager.getMessagesByIds(['msg-1', 'msg-2', 'msg-3'], (err, messages) => {
   *   if (err) {
   *     console.error('Failed to get messages:', err);
   *   } else {
   *     console.log(`Retrieved ${messages.length} messages`);
   *     messages.forEach(msg => {
   *       console.log(`Message ${msg.getId()}:`, msg.getBody());
   *     });
   *   }
   * });
   *
   * // Promise pattern
   * async function batchProcessMessages(messageIds: string[]) {
   *   try {
   *     const messages = await messageManager.getMessagesByIds(messageIds);
   *     const results = [];
   *
   *     for (const msg of messages) {
   *       const result = await processMessage(msg);
   *       results.push({ id: msg.getId(), result });
   *     }
   *
   *     console.log(`Processed ${results.length} messages`);
   *     return results;
   *   } catch (err) {
   *     console.error('Batch processing failed:', err);
   *   }
   * }
   * ```
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
   * Retrieves a single message by its ID.
   *
   * This method returns the full message object including all metadata and body content.
   *
   * @param messageId - The ID of the message to retrieve
   * @param cb - Optional callback function that will be called with the result.
   *             - On success: `cb(null, message)` where message is the full message object.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the message.
   * @returns {Promise<IMessageTransferable> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {MessageNotFoundError} When the message with the given ID doesn't exist.
   *
   * @example
   * ```typescript
   * const messageManager = new MessageManager();
   *
   * // Callback pattern
   * messageManager.getMessageById('msg-123', (err, message) => {
   *   if (err) {
   *     console.error('Message not found:', err);
   *   } else {
   *     console.log('Message details:');
   *     console.log(`  ID: ${message.getId()}`);
   *     console.log(`  Body:`, message.getBody());
   *   }
   * });
   *
   * // Promise pattern
   * async function inspectAndRequeue(messageId: string) {
   *   try {
   *     const message = await messageManager.getMessageById(messageId);
   *     const body = message.getBody();
   *     // ...
   *     // ...
   *     const newId = await messageManager.requeueMessageById(messageId);
   *     console.log(`Message ${messageId} requeued as ${newId}`);
   *   } catch (err) {
   *     console.error('Failed to inspect message:', err);
   *   }
   * }
   * ```
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
   * This method permanently removes multiple messages from the system. The deletion
   * is performed atomically across all message-related data structures.
   *
   * @param ids - Array of message IDs to delete
   * @param cb - Optional callback function that will be called with the deletion result.
   *             - On success: `cb(null, response)` where response contains deletion statistics.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the response.
   * @returns {Promise<IMessageManagerDeleteResponse> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {QueueLockedError} When the associated queue is locked.
   * @throws {InvalidQueueStateError} When the queue is in an invalid state.
   *
   * @example
   * ```typescript
   * const messageManager = new MessageManager();
   *
   * // Callback pattern
   * messageManager.deleteMessagesByIds(['msg-1', 'msg-2', 'msg-3'], (err, response) => {
   *   if (err) {
   *     console.error('Failed to delete messages:', err);
   *   } else {
   *     console.log(`Deleted ${response.deletedCount} messages`);
   *     console.log('Deleted IDs:', response.deletedIds);
   *   }
   * });
   *
   * // Promise pattern
   * async function cleanupOldMessages(messageIds: string[]) {
   *   try {
   *     const response = await messageManager.deleteMessagesByIds(messageIds);
   *     console.log(`Successfully cleaned up ${response.deletedCount} old messages`);
   *     return response;
   *   } catch (err) {
   *     console.error('Cleanup failed:', err);
   *     throw err;
   *   }
   * }
   * ```
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
   * This method permanently removes a single message from the system.
   * It's a convenience wrapper around `deleteMessagesByIds`.
   *
   * @param id - The ID of the message to delete
   * @param cb - Optional callback function that will be called with the result.
   *             - On success: `cb(null, response)` where response contains deletion statistics.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the response.
   * @returns {Promise<IMessageManagerDeleteResponse> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {QueueLockedError} When the associated queue is locked.
   * @throws {InvalidQueueStateError} When the queue is in an invalid state.
   *
   * @example
   * ```typescript
   * const messageManager = new MessageManager();
   *
   * // Callback pattern
   * messageManager.deleteMessageById('msg-123', (err, response) => {
   *   if (err) {
   *     console.error('Failed to delete message:', err);
   *   } else {
   *     console.log(`Message deleted: ${response.deletedIds[0]}`);
   *   }
   * });
   *
   * // Promise pattern
   * async function deleteIfFailed(messageId: string) {
   *   try {
   *     const status = await messageManager.getMessageStatus(messageId);
   *     if (status === EMessagePropertyStatus.DEAD_LETTERED) {
   *       await messageManager.deleteMessageById(messageId);
   *       console.log(`Deleted dead-lettered message: ${messageId}`);
   *     }
   *   } catch (err) {
   *     console.error('Failed to delete message:', err);
   *   }
   * }
   * ```
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
   * Requeues a message with the given ID.
   *
   * This operation creates a new copy of the message and marks the original as requeued.
   * The new message is placed back into the queue for reprocessing, while the original
   * message's state is updated to reflect that it has been requeued.
   *
   * @param messageId - The ID of the message to requeue
   * @param cb - Optional callback function that will be called with the result.
   *             - On success: `cb(null, newMessageId)` where newMessageId is the ID of the new message.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the new message ID.
   * @returns {Promise<string> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {MessageNotFoundError} When the message with the given ID doesn't exist.
   * @throws {MessageNotRequeuableError} When the message cannot be requeued (e.g., already acknowledged).
   * @throws {RequeueMessageScriptError} When the requeue operation fails.
   * @throws {UnexpectedScriptReplyError} When Redis returns an unexpected response.
   * @throws {QueueLockedError} When the associated queue is locked.
   * @throws {InvalidQueueStateError} When the queue is in an invalid state.
   *
   * @example
   * ```typescript
   * const messageManager = new MessageManager();
   *
   * // Callback pattern
   * messageManager.requeueMessageById('msg-123', (err, newMessageId) => {
   *   if (err) {
   *     console.error('Failed to requeue message:', err);
   *   } else {
   *     console.log(`Message requeued. New ID: ${newMessageId}`);
   *   }
   * });
   *
   * // Promise pattern
   * async function retryFailedMessages(messageIds: string[]) {
   *   const results = {
   *     success: [],
   *     failed: []
   *   };
   *
   *   for (const id of messageIds) {
   *     try {
   *       const newId = await messageManager.requeueMessageById(id);
   *       results.success.push({ original: id, new: newId });
   *       console.log(`Message ${id} requeued as ${newId}`);
   *     } catch (err) {
   *       results.failed.push({ id, error: err.message });
   *       console.error(`Failed to requeue ${id}:`, err.message);
   *     }
   *   }
   *
   *   return results;
   * }
   * ```
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
}
