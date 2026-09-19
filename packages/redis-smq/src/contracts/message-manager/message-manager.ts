/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  IMessageStateTransferable,
  IMessageTransferable,
} from '../message/message.js';
import { TMessageUnacknowledgementHistory } from '../message/index.js';

/**
 * Error information from a batch delete operation.
 *
 * Returned by `deleteMessagesByIds` and `deleteMessageById`. The
 * `status` field summarizes the overall outcome; the `stats` object
 * gives the per-message counts that produced the summary.
 *
 * The status is derived from the counts:
 *
 *   - `OK`: every requested message was deleted.
 *   - `PARTIAL_SUCCESS`: at least one message was deleted, but at least
 *     one was not (typically because it was not found, or was in a
 *     state that prevents deletion).
 *   - `MESSAGE_NOT_DELETED`: no message was deleted.
 *
 * Callers who need to know exactly which messages failed should delete
 * messages one at a time and inspect the error for each call, rather
 * than relying on the batch response.
 */
export interface IMessageManagerDeleteResponse {
  status: TMessageManagerDeleteStatus;

  stats: {
    /** Total number of messages processed (deleted or not). */
    processed: number;

    /** Number of messages successfully deleted. */
    success: number;

    /** Number of messages that were not found. */
    notFound: number;

    /** Number of messages skipped because they were in the PROCESSING state. */
    inProcess: number;
  };
}

/**
 * Overall outcome of a batch delete.
 *
 * See `IMessageManagerDeleteResponse` for how each value is derived.
 */
export type TMessageManagerDeleteStatus =
  | 'OK'
  | 'PARTIAL_SUCCESS'
  | 'MESSAGE_NOT_FOUND'
  | 'MESSAGE_IN_PROCESS'
  | 'MESSAGE_NOT_DELETED'
  | 'INVALID_PARAMETERS';

/**
 * Manages individual messages by ID.
 *
 * Use this class when the caller already has a message ID and wants to
 * inspect, delete, or requeue that specific message. For browsing
 * messages by queue, use the `QueueMessages` family
 * (`QueuePendingMessages`, `QueuePublishedMessages`, and so on).
 *
 * All methods operate on the message's Redis hash and any queue-level
 * data structures the message participates in. Deleting a message
 * removes it from its current queue's pending, scheduled, or
 * dead-lettered list, and from the queue's message registry.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete class.
 */
export interface IMessageManager {
  /**
   * Returns the current status of a message.
   *
   * The status is read from the message's `STATUS` hash field and
   * reflects the last state transition the message underwent. See
   * `EMessagePropertyStatus` for the possible values.
   *
   * Fails with `MessageNotFoundError` if no message exists with the
   * given ID.
   *
   * @example
   * // Promise
   * const status = await messageManager.getMessageStatus('msg-123');
   * if (status === EMessagePropertyStatus.DEAD_LETTERED) {
   *   console.log('The message has been dead-lettered');
   * }
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

  /**
   * Returns the runtime state of a message.
   *
   * The state is the same `IMessageStateTransferable` object that
   * `IMessageTransferable.messageState` carries — all timestamps,
   * counters, and flags for the message. Use this method when the
   * caller only needs the state, not the full message payload.
   *
   * Fails with `MessageNotFoundError` if no message exists with the
   * given ID.
   */
  getMessageState(messageId: string): Promise<IMessageStateTransferable>;
  getMessageState(
    messageId: string,
    cb: ICallback<IMessageStateTransferable>,
  ): void;

  /**
   * Returns multiple messages by ID.
   *
   * Preserves the caller's order — the `n`th result corresponds to the
   * `n`th input ID. Every ID in the input array must exist; a single
   * missing ID causes the whole call to reject with
   * `MessageNotFoundError`.
   *
   * This is a strict semantics: a caller who wants best-effort behavior
   * should call `getMessageById` per ID and handle the not-found case
   * individually.
   *
   * Each returned `IMessageTransferable` carries the full message
   * payload and state. For a caller who only needs the state, calling
   * `getMessageState` per ID is cheaper — it reads only the message hash
   * and skips the payload deserialization.
   */
  getMessagesByIds(messageIds: string[]): Promise<IMessageTransferable[]>;
  getMessagesByIds(
    messageIds: string[],
    cb: ICallback<IMessageTransferable[]>,
  ): void;

  /**
   * Returns one message by ID.
   *
   * Fails with `MessageNotFoundError` if the message does not exist.
   */
  getMessageById(messageId: string): Promise<IMessageTransferable>;
  getMessageById(messageId: string, cb: ICallback<IMessageTransferable>): void;

  /**
   * Deletes multiple messages by ID.
   *
   * The messages may be in different queues and different states. The
   * batch is grouped internally by queue and by consumer group, and each
   * group is deleted in a single Lua call.
   *
   * A message in the `PROCESSING` state cannot be deleted — deleting a
   * message while a consumer is working on it would leave the consumer
   * holding a stale reference, and the message's eventual ack/unack
   * would fail. Such messages are counted in `stats.inProcess` and
   * skipped; the response status reflects the partial outcome.
   *
   * A message that does not exist is counted in `stats.notFound` and
   * skipped. Unlike the read methods, `deleteMessagesByIds` does **not**
   * fail on a missing message — it reports the miss in `stats` and
   * continues.
   *
   * The response's `status` field summarizes the outcome:
   *   - `OK` if every processed message was deleted
   *   - `PARTIAL_SUCCESS` if some were deleted and some were not
   *   - `MESSAGE_NOT_DELETED` if none were deleted
   *
   * The method does not reject for missing or in-process messages. It
   * only rejects on infrastructure errors (Redis unavailable, script
   * failure).
   *
   * @example
   * // Promise
   * const result = await messageManager.deleteMessagesByIds(['msg-1', 'msg-2']);
   * console.log(`${result.stats.success} deleted, ${result.stats.notFound} missing`);
   *
   * // Callback
   * messageManager.deleteMessagesByIds(['msg-1', 'msg-2'], (err, result) => {
   *   if (err) throw err;
   *   console.log(result.status);
   * });
   */
  deleteMessagesByIds(ids: string[]): Promise<IMessageManagerDeleteResponse>;
  deleteMessagesByIds(
    ids: string[],
    cb: ICallback<IMessageManagerDeleteResponse>,
  ): void;

  /**
   * Deletes a single message by ID.
   *
   * Delegates to `deleteMessagesByIds` with a one-element array. The
   * response's `stats` object has `processed: 1` and exactly one of
   * `success`, `notFound`, or `inProcess` set to 1.
   *
   * Same semantics as the batch method: does not reject on a missing
   * message, does not reject on an in-process message, only rejects on
   * infrastructure errors.
   */
  deleteMessageById(id: string): Promise<IMessageManagerDeleteResponse>;
  deleteMessageById(
    id: string,
    cb: ICallback<IMessageManagerDeleteResponse>,
  ): void;

  /**
   * Requeues a message by ID.
   *
   * Requeuing creates a **new** message from the original. The new
   * message is published to the original's destination queue with the
   * original's payload and consume options; the original message remains
   * where it was (in the acknowledged or dead-lettered list) but its
   * requeue counters are updated so the two can be correlated.
   *
   * Preconditions:
   *   - The original message must be in the `ACKNOWLEDGED` or
   *     `DEAD_LETTERED` state. Attempting to requeue a `PENDING`,
   *     `PROCESSING`, or `SCHEDULED` message fails with
   *     `MessageNotRequeuableError`.
   *   - For PUB/SUB messages, the original's consumer group must still
   *     exist. If it was deleted, the requeue fails with
   *     `MessageNotFoundError` (the script reports the group is gone).
   *
   * Returns the ID of the new message. The original message's
   * `requeueCount` is incremented, `requeuedAt` is set on the first
   * requeue, and `lastRequeuedAt` is updated on every requeue. The new
   * message's `requeuedMessageParentId` is set to the original's ID.
   *
   * A message may be requeued multiple times. Each requeue produces a
   * distinct new message with its own ID.
   *
   * @example
   * // Promise
   * const newId = await messageManager.requeueMessageById('msg-123');
   * console.log(`New message: ${newId}`);
   *
   * // Callback
   * messageManager.requeueMessageById('msg-123', (err, newId) => {
   *   if (err) throw err;
   *   console.log(newId);
   * });
   */
  requeueMessageById(messageId: string): Promise<string>;
  requeueMessageById(messageId: string, cb: ICallback<string>): void;

  /**
   * Returns the unacknowledgement history of a message.
   *
   * The history is a list of records describing every time the message
   * was unacknowledged — the cause, the resolution action taken, the
   * retry count at that moment, and the timestamp.
   *
   * Requires the unacknowledgement history audit to be enabled in the
   * configuration. If it is disabled, the method fails with
   * `UnacknowledgmentHistoryDisabledError`.
   *
   * Fails with `MessageNotFoundError` if the message does not exist.
   * A message that has never been unacknowledged returns an empty
   * array.
   *
   * The order of records is oldest first — the list is `LPUSH`-ed on
   * every unacknowledgement, so index 0 is the most recent. If you need
   * newest first, reverse the array at the call site.
   *
   * @example
   * // Promise
   * const history = await messageManager.getMessageUnacknowledgementHistory('msg-123');
   * history.forEach((record) => {
   *   console.log(`${record.cause} -> ${record.action} (retry ${record.retryCount})`);
   * });
   *
   * // Callback
   * messageManager.getMessageUnacknowledgementHistory('msg-123', (err, history) => {
   *   if (err) throw err;
   *   console.log(history.length);
   * });
   */
  getMessageUnacknowledgementHistory(
    messageId: string,
  ): Promise<TMessageUnacknowledgementHistory>;
  getMessageUnacknowledgementHistory(
    messageId: string,
    cb: ICallback<TMessageUnacknowledgementHistory>,
  ): void;
}
