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
import { Configuration } from '../config-manager/configuration.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import { IMessageTransferable } from '../message/index.js';
import { TPurgeQueueJob } from '../common/background-jobs/jobs/purge-queue/types/index.js';
import { EQueueMessageType } from './types/index.js';
import { _parseQueueExtendedParams } from '../queue-manager/_/_parse-queue-extended-params.js';
import { MessageBrowserFactory } from './message-browser-factory.js';

/**
 * Base class for queue message operations.
 *
 * Manages browsing, counting, and purging messages in queues.
 * Supports pending, acknowledged, scheduled, dead-lettered, and published messages.
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
   * Gets total message count in the queue.
   *
   * @param queue - Queue name (string) or { name, ns } or { queueParams, groupId }
   * @param cb - (err, count) => void. Returns number
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const count = await messages.countMessages('orders');
   *
   * // Callback
   * messages.countMessages('orders', (err, count) => {
   *   if (err) throw err;
   *   console.log(count);
   * });
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
   * Gets message IDs for a specific page.
   *
   * @param queue - Queue name (string) or { name, ns } or { queueParams, groupId }
   * @param page - Page number (starts at 1)
   * @param pageSize - Items per page
   * @param cb - (err, page) => void. Returns IBrowserPage<string>
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const page = await messages.getMessageIds('orders', 1, 10);
   * console.log(page.items);
   *
   * // Callback
   * messages.getMessageIds('orders', 1, 10, (err, page) => {
   *   if (err) throw err;
   *   console.log(page.items);
   * });
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
   * Gets full message objects for a specific page.
   *
   * @param queue - Queue name (string) or { name, ns } or { queueParams, groupId }
   * @param page - Page number (starts at 1)
   * @param pageSize - Items per page
   * @param cb - (err, page) => void. Returns IBrowserPage<IMessageTransferable>
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const page = await messages.getMessages('orders', 1, 5);
   * page.items.forEach(msg => console.log(msg.getBody()));
   *
   * // Callback
   * messages.getMessages('orders', 1, 5, (err, page) => {
   *   if (err) throw err;
   *   page.items.forEach(msg => console.log(msg.getBody()));
   * });
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
   * Removes all messages from the queue.
   *
   * Runs as a background job. Use getPurgeJobStatus() to check progress.
   *
   * @param queue - Queue name (string) or { name, ns } or { queueParams, groupId }
   * @param cb - (err, jobId) => void. Returns string
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const jobId = await messages.purge('old-queue');
   *
   * // Callback
   * messages.purge('old-queue', (err, jobId) => {
   *   if (err) throw err;
   *   console.log(jobId);
   * });
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
   * Stops an in-progress purge job.
   *
   * @param queue - Queue name (string) or { name, ns } or { queueParams, groupId }
   * @param jobId - Purge job ID to cancel
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await messages.cancelPurge('orders', jobId);
   *
   * // Callback
   * messages.cancelPurge('orders', jobId, (err) => {
   *   if (err) throw err;
   * });
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
   * Gets detailed information about a purge job.
   *
   * @param queue - Queue name (string) or { name, ns } or { queueParams, groupId }
   * @param jobId - Purge job ID
   * @param cb - (err, job) => void. Returns TPurgeQueueJob
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const job = await messages.getPurgeJob('orders', jobId);
   * console.log(job.status);
   *
   * // Callback
   * messages.getPurgeJob('orders', jobId, (err, job) => {
   *   if (err) throw err;
   *   console.log(job.status);
   * });
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
   * Gets the current status of a purge job.
   *
   * Possible statuses: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
   *
   * @param queue - Queue name (string) or { name, ns } or { queueParams, groupId }
   * @param jobId - Purge job ID
   * @param cb - (err, status) => void. Returns EBackgroundJobStatus
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const status = await messages.getPurgeJobStatus('orders', jobId);
   * if (status === 'COMPLETED') {
   *   console.log('Queue purged');
   * }
   *
   * // Callback
   * messages.getPurgeJobStatus('orders', jobId, (err, status) => {
   *   if (err) throw err;
   *   if (status === 'COMPLETED') console.log('Queue purged');
   * });
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
