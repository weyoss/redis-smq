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
import {
  IBrowserPage,
  IMessageBrowser,
} from './message-browser/types/index.js';
import { EBackgroundJobStatus } from '../common/index.js';
import { Configuration } from '../config/index.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import { IMessageTransferable } from '../message/index.js';
import { TPurgeQueueJob } from '../common/background-jobs/jobs/purge-queue/types/index.js';
import { EQueueMessageType } from './types/index.js';
import { _parseQueueExtendedParams } from '../queue-manager/_/_parse-queue-extended-params.js';
import { MessageBrowserFactory } from './message-browser-factory.js';

/**
 * Base class for queue message operations that handles common patterns
 * and delegates to specialized implementations.
 *
 * This abstract class provides common functionality for browsing, counting,
 * and managing messages in queues, with support for different message types
 * (pending, acknowledged, scheduled, dead-lettered, published).
 *
 * @example
 * ```typescript
 * // Using a concrete implementation
 * const pendingMessages = new QueuePendingMessages();
 *
 * // Count messages with callback
 * pendingMessages.countMessages('my-queue', (err, count) => {
 *   if (err) console.error('Failed to count:', err);
 *   else console.log('Total messages:', count);
 * });
 *
 * // Count messages with promise
 * const count = await pendingMessages.countMessages('my-queue');
 * console.log('Total messages:', count);
 * ```
 */
export abstract class QueueMessagesAbstract implements IMessageBrowser {
  protected readonly logger: ReturnType<typeof createLogger>;

  /**
   * Type of queue messages this browser handles.
   */
  public abstract readonly messageType: EQueueMessageType;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
  }

  protected withMessageBrowser<T>(
    queue: TQueueExtendedParams,
    operation: (browser: IMessageBrowser, cb: ICallback<T>) => void,
    cb: ICallback<T>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) return cb(parsedParams);

    MessageBrowserFactory.createBrowserForQueue(
      parsedParams.queueParams,
      this.messageType,
      this.logger,
      (err, browser) => {
        if (err) return cb(err);
        if (!browser) return cb(new CallbackEmptyReplyError());

        operation(browser, cb);
      },
    );
  }

  /**
   * Counts the total number of messages in the queue.
   *
   * This method provides a quick way to get the total count of messages
   * of the specific type (pending, acknowledged, etc.) in a queue.
   *
   * @param queue - Extended queue parameters (string name or object with ns/name/groupId)
   * @param cb - Optional callback function invoked with the message count.
   *             - On success: `cb(null, count)` where count is the total number of messages.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the count.
   * @returns {Promise<number> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * const pendingMessages = new QueuePendingMessages();
   *
   * // Callback pattern
   * pendingMessages.countMessages('my-queue', (err, count) => {
   *   if (err) {
   *     console.error('Failed to count:', err);
   *   } else {
   *     console.log(`Queue has ${count} pending messages`);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const count = await pendingMessages.countMessages('my-queue');
   *   console.log(`Queue has ${count} pending messages`);
   * } catch (err) {
   *   console.error('Failed to count:', err);
   * }
   * ```
   */
  public countMessages(queue: TQueueExtendedParams): Promise<number>;
  public countMessages(
    queue: TQueueExtendedParams,
    cb: ICallback<number>,
  ): void;
  public countMessages(
    queue: TQueueExtendedParams,
    cb?: ICallback<number>,
  ): Promise<number> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withMessageBrowser(
        queue,
        (browser, done) => browser.countMessages(queue, done),
        callback,
      );
    });
  }

  /**
   * Retrieves message IDs for a specific page.
   *
   * This method returns a paginated list of message IDs from the queue,
   * allowing you to browse through messages efficiently without loading
   * full message content.
   *
   * **Pagination:**
   * - Page numbers start from 1 (first page)
   * - Each page contains up to `pageSize` items
   * - Returns `IBrowserPage` containing the message IDs and pagination metadata
   *
   * @param queue - Extended queue parameters (string name or object with ns/name/groupId)
   * @param page - Page number (1 = first page)
   * @param pageSize - Number of items per page (must be positive)
   * @param cb - Optional callback function invoked with the paginated message IDs.
   *             - On success: `cb(null, page)` where page contains message IDs and pagination info.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the page.
   * @returns {Promise<IBrowserPage<string>> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * const pendingMessages = new QueuePendingMessages();
   *
   * // Callback pattern
   * pendingMessages.getMessageIds('my-queue', 1, 10, (err, page) => {
   *   if (err) {
   *     console.error('Failed to get message IDs:', err);
   *   } else {
   *     console.log(`Page ${page.page}: ${page.items.length} messages`);
   *     console.log('Message IDs:', page.items);
   *     console.log(`Next page: ${page.nextPage}`);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const page = await pendingMessages.getMessageIds('my-queue', 1, 10);
   *   console.log(`Found ${page.total} total messages`);
   *   page.items.forEach(id => console.log('Message ID:', id));
   *
   *   // Load next page if available
   *   if (page.nextPage !== null) {
   *     const nextPage = await pendingMessages.getMessageIds('my-queue', page.nextPage, 10);
   *     console.log(`Next page has ${nextPage.items.length} messages`);
   *   }
   * } catch (err) {
   *   console.error('Failed to get message IDs:', err);
   * }
   * ```
   */
  public getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
  ): Promise<IBrowserPage<string>>;
  public getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void;
  public getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb?: ICallback<IBrowserPage<string>>,
  ): Promise<IBrowserPage<string>> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withMessageBrowser(
        queue,
        (browser, done) => browser.getMessageIds(queue, page, pageSize, done),
        callback,
      );
    });
  }

  /**
   * Retrieves detailed messages for a specific page.
   *
   * This method returns a paginated list of complete message objects,
   * including all message metadata and content.
   *
   * **Pagination:**
   * - Page numbers start from 1 (first page)
   * - Each page contains up to `pageSize` items
   * - Returns `IBrowserPage` containing full message objects and pagination metadata
   *
   * @param queue - Extended queue parameters (string name or object with ns/name/groupId)
   * @param page - Page number (1 = first page)
   * @param pageSize - Number of items per page (must be positive)
   * @param cb - Optional callback function invoked with the paginated messages.
   *             - On success: `cb(null, page)` where page contains message objects and pagination info.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the page.
   * @returns {Promise<IBrowserPage<IMessageTransferable>> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * const pendingMessages = new QueuePendingMessages();
   *
   * // Callback pattern - inspect messages
   * pendingMessages.getMessages('my-queue', 1, 5, (err, page) => {
   *   if (err) {
   *     console.error('Failed to get messages:', err);
   *   } else {
   *     page.items.forEach(msg => {
   *       console.log(`Message ${msg.getId()}:`);
   *       console.log(`  Body:`, msg.getBody());
   *       console.log(`  Published:`, msg.getMessageState().getPublishedAt());
   *     });
   *   }
   * });
   *
   * // Promise pattern - process all messages
   * async function browseAllMessages(queue: string) {
   *   let currentPage = 1;
   *   const pageSize = 20;
   *   let hasMore = true;
   *
   *   while (hasMore) {
   *     const page = await pendingMessages.getMessages(queue, currentPage, pageSize);
   *     console.log(`Processing page ${currentPage} with ${page.items.length} messages`);
   *
   *     for (const msg of page.items) {
   *       await processMessage(msg);
   *     }
   *
   *     hasMore = page.nextPage !== null;
   *     currentPage++;
   *   }
   * }
   *
   * // Export messages to file
   * const page = await pendingMessages.getMessages('my-queue', 1, 1000);
   * const messages = page.items.map(msg => ({
   *   id: msg.getId(),
   *   body: msg.getBody(),
   *   timestamp: msg.getMessageState().getPublishedAt()
   * }));
   * await fs.writeFile('messages.json', JSON.stringify(messages, null, 2));
   * ```
   */
  public getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
  ): Promise<IBrowserPage<IMessageTransferable>>;
  public getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void;
  public getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb?: ICallback<IBrowserPage<IMessageTransferable>>,
  ): Promise<IBrowserPage<IMessageTransferable>> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withMessageBrowser(
        queue,
        (browser, done) => browser.getMessages(queue, page, pageSize, done),
        callback,
      );
    });
  }

  /**
   * Purges all messages from the specified queue.
   *
   * This operation removes all messages of the specific type (pending, acknowledged, etc.)
   * from the queue. The operation is performed asynchronously using a background job
   * to avoid blocking the main thread, especially for large queues.
   *
   * **Important Notes:**
   * - This operation is asynchronous and returns immediately with a job ID
   * - The purge continues in the background even if the application restarts
   * - Use the returned job ID to track progress and check completion
   * - Purge operations can be cancelled using `cancelPurge()`
   * - This operation is irreversible - messages cannot be recovered once purged
   *
   * **Workflow:**
   * 1. Call `purge()` to start the operation
   * 2. Receive a job ID immediately
   * 3. Use `getPurgeJobStatus()` to check progress
   * 4. Use `getPurgeJob()` to get detailed job information
   * 5. Use `cancelPurge()` if needed to stop an in-progress purge
   *
   * @param queue - Extended queue parameters (string name or object with ns/name/groupId)
   * @param cb - Optional callback function invoked with the purge job ID.
   *             - On success: `cb(null, jobId)` where jobId is the ID of the background purge job.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the job ID.
   * @returns {Promise<string> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * const pendingMessages = new QueuePendingMessages();
   *
   * // Callback pattern
   * pendingMessages.purge('my-queue', (err, jobId) => {
   *   if (err) {
   *     console.error('Failed to start purge:', err);
   *   } else {
   *     console.log('Purge job started with ID:', jobId);
   *
   *     // Check status after 5 seconds
   *     setTimeout(() => {
   *       pendingMessages.getPurgeJobStatus('my-queue', jobId, (err, status) => {
   *         if (!err) {
   *           console.log('Purge job status:', status);
   *         }
   *       });
   *     }, 5000);
   *   }
   * });
   *
   * // Promise pattern with status monitoring
   * async function purgeQueue(queue: string) {
   *   try {
   *     const jobId = await pendingMessages.purge(queue);
   *     console.log(`Purge job started: ${jobId}`);
   *
   *     // Poll for completion
   *     let status = EBackgroundJobStatus.PENDING;
   *     while (status === EBackgroundJobStatus.PENDING ||
   *            status === EBackgroundJobStatus.PROCESSING) {
   *       await new Promise(resolve => setTimeout(resolve, 1000));
   *       status = await pendingMessages.getPurgeJobStatus(queue, jobId);
   *       console.log(`Current status: ${status}`);
   *     }
   *
   *     if (status === EBackgroundJobStatus.COMPLETED) {
   *       console.log('Queue purged successfully');
   *     } else {
   *       console.error('Purge job failed or was cancelled');
   *     }
   *   } catch (err) {
   *     console.error('Purge failed:', err);
   *   }
   * }
   *
   * // Purge with custom namespace
   * const jobId = await pendingMessages.purge({
   *   ns: 'production',
   *   name: 'orders',
   *   groupId: 'group-1'
   * });
   * ```
   */
  public purge(queue: TQueueExtendedParams): Promise<string>;
  public purge(queue: TQueueExtendedParams, cb: ICallback<string>): void;
  public purge(
    queue: TQueueExtendedParams,
    cb?: ICallback<string>,
  ): Promise<string> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withMessageBrowser(
        queue,
        (browser, done) => browser.purge(queue, done),
        callback,
      );
    });
  }

  /**
   * Cancels an active purge job that is currently in progress.
   *
   * This method attempts to cancel a running purge operation. Cancellation is
   * asynchronous and may not be immediate, especially if the purge is already
   * in the middle of deleting a large batch of messages.
   *
   * **Important Notes:**
   * - Completed or failed jobs cannot be cancelled
   * - Cancellation requests are processed asynchronously
   * - After cancellation, the queue may be partially purged
   *
   * @param queue - Extended queue parameters (string name or object with ns/name/groupId)
   * @param jobId - The ID of the purge job to cancel (returned from `purge()`)
   * @param cb - Optional callback function invoked when cancellation is processed.
   *             - On success: `cb(null)`
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves when cancelled.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {BackgroundJobNotFoundError} When the specified job ID doesn't exist.
   * @throws {BackgroundJobNotCancellableError} When the job cannot be cancelled (already completed or failed).
   *
   * @example
   * ```typescript
   * const pendingMessages = new QueuePendingMessages();
   *
   * // Callback pattern
   * const jobId = await pendingMessages.purge('my-queue');
   *
   * // Cancel after 2 seconds
   * setTimeout(() => {
   *   pendingMessages.cancelPurge('my-queue', jobId, (err) => {
   *     if (err) {
   *       console.error('Failed to cancel purge:', err);
   *     } else {
   *       console.log('Purge job cancelled');
   *     }
   *   });
   * }, 2000);
   *
   * // Promise pattern with status checking
   * async function cancelIfRunning(queue: string, jobId: string) {
   *   try {
   *     const status = await pendingMessages.getPurgeJobStatus(queue, jobId);
   *     if (status === EBackgroundJobStatus.PROCESSING) {
   *       await pendingMessages.cancelPurge(queue, jobId);
   *       console.log('Purge job cancelled');
   *     } else {
   *       console.log('Job is not running, cannot cancel');
   *     }
   *   } catch (err) {
   *     console.error('Failed to cancel purge:', err);
   *   }
   * }
   * ```
   */
  public cancelPurge(queue: TQueueExtendedParams, jobId: string): Promise<void>;
  public cancelPurge(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback,
  ): void;
  public cancelPurge(
    queue: TQueueExtendedParams,
    jobId: string,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withMessageBrowser(
        queue,
        (browser, done) => browser.cancelPurge(queue, jobId, done),
        callback,
      );
    });
  }

  /**
   * Retrieves comprehensive details about a specific purge job.
   *
   * This method returns the full background job object, including metadata,
   * target information, timestamps, and any error messages if the job failed.
   *
   * **Job Information Includes:**
   * - Job ID and type
   * - Current status (pending, processing, completed, failed, cancelled)
   * - Target queue information
   * - Creation and completion timestamps
   * - Error details if job failed
   * - Progress information (if available)
   *
   * @param queue - Extended queue parameters (string name or object with ns/name/groupId)
   * @param jobId - The ID of the purge job to retrieve
   * @param cb - Optional callback function invoked with the job details.
   *             - On success: `cb(null, job)` where job is the full job object.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the job.
   * @returns {Promise<IBackgroundJob<TPurgeQueueJobPayload>> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {BackgroundJobNotFoundError} When the specified job ID doesn't exist.
   *
   * @example
   * ```typescript
   * const pendingMessages = new QueuePendingMessages();
   *
   * // Callback pattern
   * pendingMessages.getPurgeJob('my-queue', jobId, (err, job) => {
   *   if (err) {
   *     console.error('Failed to get job details:', err);
   *   } else {
   *     console.log('Job details:');
   *     console.log(`  ID: ${job.id}`);
   *     console.log(`  Status: ${job.status}`);
   *     console.log(`  Created: ${new Date(job.createdAt)}`);
   *     console.log(`  Target queue: ${job.target.queue.name}@${job.target.queue.ns}`);
   *     if (job.status === EBackgroundJobStatus.FAILED) {
   *       console.log(`  Error: ${job.error}`);
   *     }
   *   }
   * });
   *
   * // Promise pattern with monitoring
   * async function monitorPurgeJob(queue: string, jobId: string) {
   *   try {
   *     const job = await pendingMessages.getPurgeJob(queue, jobId);
   *     console.log(`Purge job status: ${job.status}`);
   *
   *     if (job.status === EBackgroundJobStatus.COMPLETED) {
   *       console.log('Purge completed successfully');
   *       return true;
   *     }
   *
   *     if (job.status === EBackgroundJobStatus.FAILED) {
   *       console.error(`Purge failed: ${job.error}`);
   *       return false;
   *     }
   *
   *     return null; // Still in progress
   *   } catch (err) {
   *     console.error('Failed to monitor job:', err);
   *     return false;
   *   }
   * }
   * ```
   */
  public getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
  ): Promise<TPurgeQueueJob>;
  public getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<TPurgeQueueJob>,
  ): void;
  public getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb?: ICallback<TPurgeQueueJob>,
  ): Promise<TPurgeQueueJob> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withMessageBrowser(
        queue,
        (browser, done) => browser.getPurgeJob(queue, jobId, done),
        callback,
      );
    });
  }

  /**
   * Retrieves the current status of a purge job.
   *
   * This method provides a quick way to check the status of a purge job
   * without fetching all job details. The status can be one of:
   * - `PENDING`: Job is queued but not yet started
   * - `PROCESSING`: Job is actively running
   * - `COMPLETED`: Job finished successfully
   * - `FAILED`: Job failed with an error
   * - `CANCELLED`: Job was cancelled
   *
   * **Use Cases:**
   * - Polling for job completion
   * - Quick status checks in monitoring systems
   * - Building progress indicators
   * - Determining if a job can be cancelled
   *
   * @param queue - Extended queue parameters (string name or object with ns/name/groupId)
   * @param jobId - The ID of the purge job to check
   * @param cb - Optional callback function invoked with the job status.
   *             - On success: `cb(null, status)` where status is an enum value.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the status.
   * @returns {Promise<EBackgroundJobStatus> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {BackgroundJobNotFoundError} When the specified job ID doesn't exist.
   *
   * @example
   * ```typescript
   * const pendingMessages = new QueuePendingMessages();
   *
   * // Callback pattern
   * pendingMessages.getPurgeJobStatus('my-queue', jobId, (err, status) => {
   *   if (err) {
   *     console.error('Failed to get status:', err);
   *   } else {
   *     console.log(`Job status: ${status}`);
   *
   *     if (status === EBackgroundJobStatus.COMPLETED) {
   *       console.log('Queue has been purged');
   *     }
   *   }
   * });
   *
   * // Promise pattern with polling
   * async function waitForPurgeCompletion(queue: string, jobId: string) {
   *   let status = await pendingMessages.getPurgeJobStatus(queue, jobId);
   *
   *   while (status === EBackgroundJobStatus.PENDING ||
   *          status === EBackgroundJobStatus.PROCESSING) {
   *     console.log(`Waiting for purge to complete... Current status: ${status}`);
   *     await new Promise(resolve => setTimeout(resolve, 1000));
   *     status = await pendingMessages.getPurgeJobStatus(queue, jobId);
   *   }
   *
   *   if (status === EBackgroundJobStatus.COMPLETED) {
   *     console.log('Purge completed successfully!');
   *     return true;
   *   } else if (status === EBackgroundJobStatus.FAILED) {
   *     console.error('Purge failed');
   *     return false;
   *   } else {
   *     console.log(`Purge was ${status.toLowerCase()}`);
   *     return false;
   *   }
   * }
   *
   * // Check status before cancelling
   * const status = await pendingMessages.getPurgeJobStatus('my-queue', jobId);
   * if (status === EBackgroundJobStatus.PROCESSING) {
   *   await pendingMessages.cancelPurge('my-queue', jobId);
   *   console.log('Purge cancelled');
   * } else {
   *   console.log('Cannot cancel: job is not running');
   * }
   * ```
   */
  public getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
  ): Promise<EBackgroundJobStatus>;
  public getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<EBackgroundJobStatus>,
  ): void;
  public getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb?: ICallback<EBackgroundJobStatus>,
  ): Promise<EBackgroundJobStatus> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.withMessageBrowser(
        queue,
        (browser, done) => browser.getPurgeJobStatus(queue, jobId, done),
        callback,
      );
    });
  }
}
