/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IMessageTransferable } from '../message/message.js';
import { TQueueExtendedParams } from '../queue-manager/queue.js';

// ═══════════════════════════════════════════════════════════════════════════
// Page and count shapes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * One page of results from a queue-message browser.
 *
 * The `totalItems` field describes the size of the whole result set, not
 * the size of `items`. A caller who wants to compute the number of pages
 * divides `totalItems` by the page size they requested.
 */
export interface IBrowserPage<T> {
  /** Total number of items in the full result set. */
  totalItems: number;

  /** The items in this page. */
  items: T[];
}

/**
 * Message counts by status for a queue.
 */
export interface IQueuePublishedMessagesCountByStatus {
  /** Number of acknowledged messages (also known as "consumed"). */
  acknowledged: number;

  /** Number of dead-lettered messages. */
  deadLettered: number;

  /**
   * Number of pending messages.
   */
  pending: number;

  /** Number of scheduled messages. */
  scheduled: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Base browser interface
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common surface shared by every queue-message browser.
 *
 * The five concrete browsers — published, pending, scheduled,
 * acknowledged, dead-lettered — differ in which Redis structure they
 * read, but they expose the same operations: count, browse by page,
 * browse by ID, and manage purge jobs. This interface captures that
 * shared surface.
 *
 * Each concrete browser extends this interface with type-specific
 * additions (only `IQueuePublishedMessages` adds a method today).
 *
 * Purge is asynchronous. `purge()` does not delete messages directly —
 * it enqueues a background job that deletes messages in batches, and
 * returns the job ID immediately. A caller who needs to know when the
 * purge completes either polls `getPurgeJobStatus()` or subscribes to
 * the background-job event bus.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete classes.
 */
export interface IQueueMessages {
  /**
   * Returns the total number of messages in this category for a queue.
   *
   * The count is read from the underlying Redis structure: `LLEN` for
   * list-backed categories, `ZCARD` for sorted-set-backed categories,
   * `SCARD` for set-backed categories. None of these are paginated; the
   * count is always the full size of the category.
   *
   * For PUB/SUB queues, the count depends on the browser:
   *
   *   - `IQueuePendingMessages.countMessages()` — the base browser
   *     reads the queue-level pending list, which does not exist for
   *     PUB/SUB queues. Use the per-group counts from
   *     `IQueuePublishedMessages.countMessagesByStatus().pending`
   *     instead.
   *
   *   - The other categories (published, scheduled, acknowledged,
   *     dead-lettered) are queue-level and return a single count.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   *
   * @example
   * // Promise
   * const count = await messages.countMessages('orders');
   * console.log(`${count} messages`);
   *
   * // Callback
   * messages.countMessages('orders', (err, count) => {
   *   if (err) throw err;
   *   console.log(count);
   * });
   */
  countMessages(queue: TQueueExtendedParams): Promise<number>;
  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void;

  /**
   * Returns one page of message IDs from the category.
   *
   * Pages are 1-indexed. Page 1 with a page size of 20 returns the first
   * twenty IDs; page 2 returns the next twenty, and so on.
   *
   * The order of IDs within a page depends on the underlying structure:
   *
   *   - List-backed categories (pending FIFO/LIFO, published, scheduled,
   *     acknowledged, dead-lettered): insertion order — oldest first for
   *     FIFO, newest first for LIFO.
   *
   *   - Sorted-set-backed categories (scheduled, priority pending):
   *     score order — messages scheduled earlier or with higher priority
   *     come first.
   *
   * The returned `IBrowserPage` carries the total item count, so a
   * caller can compute the number of pages without a separate call.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist. For
   * PUB/SUB queues, the browser factory rejects the call with
   * `ConsumerGroupRequiredError` if no group ID is provided.
   */
  getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
  ): Promise<IBrowserPage<string>>;
  getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void;

  /**
   * Returns one page of full messages from the category.
   *
   * Same pagination semantics as `getMessageIds()`, but each item is a
   * fully hydrated `IMessageTransferable` — payload, state, status,
   * destination queue. Use this when the caller needs the message
   * content; use `getMessageIds()` when only the IDs are needed
   * (a much cheaper read).
   *
   * Messages that were deleted between the ID read and the payload read
   * are omitted from the result. The page's `items.length` may
   * therefore be smaller than `pageSize` even when more pages exist.
   * The `totalItems` count still reflects the ID read.
   */
  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
  ): Promise<IBrowserPage<IMessageTransferable>>;
  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void;

  /**
   * Enqueues a background job that deletes every message in the
   * category.
   *
   * The purge is asynchronous: this method returns immediately with a
   * job ID. The background worker deletes messages in batches, updating
   * the job's progress as it goes. The queue is locked for the duration
   * of the purge, so no other operation can consume from it or delete
   * it while the purge is running.
   *
   * Fails with `QueueLockedError` if the queue is already locked (for
   * example, by another purge job). Fails with `QueueNotFoundError` if
   * the queue does not exist.
   *
   * Use `getPurgeJobStatus()` to poll progress, or `cancelPurge()` to
   * stop the job. Cancelling a purge stops the batch loop after the
   * current batch completes; messages already deleted are not restored.
   */
  purge(queue: TQueueExtendedParams): Promise<string>;
  purge(queue: TQueueExtendedParams, cb: ICallback<string>): void;

  /**
   * Requests cancellation of an in-progress purge job.
   *
   * Cancellation is cooperative: the background worker observes the
   * request between batches and stops after the current batch completes.
   * A job that has already reached a terminal state (completed, failed,
   * cancelled) is unaffected — no error is raised.
   *
   * Fails with `InvalidPurgeQueueJobIdError` if the job ID does not
   * belong to this queue and this message category. The error is raised
   * rather than silently ignored so that a caller who mistypes a job ID
   * finds out immediately.
   */
  cancelPurge(queue: TQueueExtendedParams, jobId: string): Promise<void>;
  cancelPurge(queue: TQueueExtendedParams, jobId: string, cb: ICallback): void;

  /**
   * Returns the full purge-job record for a job.
   *
   * The record carries the job's ID, status, timestamps, and progress
   * metadata (`meta.purged` — the number of messages deleted so far).
   *
   * Fails with `InvalidPurgeQueueJobIdError` if the job ID does not
   * belong to this queue and this message category.
   *
   * @see IPurgeQueueJob
   */
  getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
  ): Promise<IPurgeQueueJob>;
  getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<IPurgeQueueJob>,
  ): void;

  /**
   * Returns the status of a purge job.
   *
   * A convenience wrapper around `getPurgeJob()` for callers who only
   * need the status. A caller building a progress dashboard typically
   * uses both: `getPurgeJob()` for the full record, `getPurgeJobStatus()`
   * for quick polling.
   *
   * Fails with the same errors as `getPurgeJob()`.
   */
  getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
  ): Promise<EBackgroundJobStatus>;
  getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<EBackgroundJobStatus>,
  ): void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Concrete browser interfaces
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Browse every message published to a queue, regardless of status.
 *
 * This browser reads the queue's published list — the master list of
 * every message ID the queue has ever accepted. It is not partitioned
 * by message status: a published entry stays in the list through
 * pending, processing, acknowledged, and dead-lettered states.
 *
 * Adding to the base surface, this browser exposes
 * `countMessagesByStatus()` — a breakdown of the queue's messages by
 * their current status. This is the only browser with a per-status view;
 * the others read single-status categories directly.
 */
export interface IQueuePublishedMessages extends IQueueMessages {
  /**
   * Returns a breakdown of the queue's messages by status.
   *
   * The four counts — acknowledged, dead-lettered, pending, scheduled —
   * are read from the queue's properties hash. They are maintained by
   * the Lua scripts and are always consistent with the underlying
   * structures.
   *
   * `pending` is polymorphic. For POINT_TO_POINT queues it is a single
   * number. For PUB/SUB queues it is a map of consumer-group ID to
   * pending count — a PUB/SUB queue has one pending list per group, and
   * the aggregate is not meaningful.
   *
   * @example
   * const counts = await published.countMessagesByStatus('orders');
   * console.log(`${counts.acknowledged} consumed`);
   * if (typeof counts.pending === 'number') {
   *   console.log(`${counts.pending} waiting`);
   * } else {
   *   for (const [group, n] of Object.entries(counts.pending)) {
   *     console.log(`${n} waiting for ${group}`);
   *   }
   * }
   */
  countMessagesByStatus(
    queue: TQueueExtendedParams,
  ): Promise<IQueuePublishedMessagesCountByStatus>;
  countMessagesByStatus(
    queue: TQueueExtendedParams,
    cb: ICallback<IQueuePublishedMessagesCountByStatus>,
  ): void;
}

/**
 * Browse messages waiting to be consumed.
 *
 * For POINT_TO_POINT queues, this browser reads the queue's pending
 * list or sorted set (depending on queue type). The list holds message
 * IDs that are ready to be dequeued but have not been claimed yet.
 *
 * For PUB/SUB queues, the pending list is per consumer group. A caller
 * browsing pending messages must specify a group ID in the queue
 * parameter (`{ queueParams, groupId }`); otherwise the browser factory
 * fails with `ConsumerGroupRequiredError`.
 */
export interface IQueuePendingMessages extends IQueueMessages {} // eslint-disable-line @typescript-eslint/no-empty-object-type

/**
 * Browse messages scheduled for future delivery.
 *
 * Scheduled messages are those with a CRON expression, a delay, or a
 * repeat count. They are stored in a Redis sorted set scored by their
 * next scheduled timestamp — a scheduled message with an earlier next
 * timestamp sorts before one with a later timestamp.
 *
 * Paging therefore returns messages in delivery order, not insertion
 * order. A message whose delay was set at construction and a message
 * whose CRON expression places it at the same moment are interleaved by
 * score.
 */
export interface IQueueScheduledMessages extends IQueueMessages {} // eslint-disable-line @typescript-eslint/no-empty-object-type

/**
 * Browse messages that have been successfully consumed.
 *
 * Acknowledged-message browsing requires the corresponding audit to be
 * enabled in the configuration. If `messageAudit.acknowledgedMessages`
 * is disabled, every method raises `AcknowledgmentAuditDisabledError`
 * before touching Redis.
 *
 * The acknowledged list is a bounded ring buffer whose size and TTL are
 * controlled by `IMessageAuditMessagesConfig`. It is not the source of
 * truth for "what has been consumed" — it is a diagnostic record of the
 * most recent acknowledgements, capped to a size the operator chose.
 */
export interface IQueueAcknowledgedMessages extends IQueueMessages {} // eslint-disable-line @typescript-eslint/no-empty-object-type

/**
 * Browse messages that failed processing and exhausted their retry
 * policy.
 *
 * Dead-lettered-message browsing requires the corresponding audit to be
 * enabled in the configuration. If `messageAudit.deadLetteredMessages`
 * is disabled, every method raises `DeadLetterAuditDisabledError` before
 * touching Redis.
 *
 * Like the acknowledged list, the dead-lettered list is a bounded ring
 * buffer sized by `IMessageAuditMessagesConfig`. Operators who need an
 * unbounded record of dead-lettered messages should forward them to
 * durable storage as they arrive, via the `consumer.messageDeadLettered`
 * event.
 */
export interface IQueueDeadLetteredMessages extends IQueueMessages {} // eslint-disable-line @typescript-eslint/no-empty-object-type

// ═══════════════════════════════════════════════════════════════════════════
// Purge job shape
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A background job that deletes messages from a queue category.
 *
 * Returned by `IQueueMessages.getPurgeJob()` and referenced by
 * `getPurgeJobStatus()`. The job runs asynchronously: `IQueueMessages.purge()`
 * returns its ID immediately; the actual deletion happens on a
 * background worker over the following seconds or minutes, depending on
 * queue size.
 *
 * The `meta.purged` counter is updated as batches complete, so a caller
 * polling the job can display progress without needing any other
 * information.
 */
export interface IPurgeQueueJob {
  /** Unique job ID. */
  id: string;

  /** Current job status. */
  status: EBackgroundJobStatus;

  /** Milliseconds since the Unix epoch, when the job was created. */
  createdAt: number;

  /** Last time the job's status changed, in milliseconds since the epoch. */
  updatedAt?: number;

  /** When the job started running, in milliseconds since the epoch. */
  startedAt?: number;

  /** When the job reached a terminal state, in milliseconds since the epoch. */
  completedAt?: number;

  /** Error message if the job failed. Absent on success and in-flight jobs. */
  error?: string;

  /** Progress metadata. */
  meta: {
    /** Number of messages deleted so far. */
    purged: number;
  };
}

/**
 * Status values for a background job.
 *
 * The lifecycle is linear: `PENDING` → `PROCESSING` → one of
 * `COMPLETED`, `FAILED`, or `CANCELED`. A job never leaves a terminal
 * state.
 *
 * `PENDING` jobs have been created but not yet picked up by a worker.
 * `PROCESSING` jobs are actively running. The three terminal states are
 * self-descriptive.
 */
export enum EBackgroundJobStatus {
  PENDING,
  PROCESSING,
  COMPLETED,
  FAILED,
  CANCELED,
}
