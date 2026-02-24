/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
} from 'redis-smq-common';
import {
  IBrowserPage,
  IMessageBrowser,
} from './message-browser/types/index.js';
import { EBackgroundJobStatus, IBackgroundJob } from '../common/index.js';
import { Configuration } from '../config/index.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import { IMessageTransferable } from '../message/index.js';
import { TPurgeQueueJobTarget } from '../common/background-jobs/jobs/purge-queue/types/index.js';
import { EQueueMessageType } from './types/index.js';
import { _parseQueueExtendedParams } from '../queue-manager/_/_parse-queue-extended-params.js';
import { MessageBrowserFactory } from './message-browser-factory.js';

/**
 * Base class for queue message operations that handles common patterns
 * and delegates to specialized implementations.
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
   * @param queue - Extended queue parameters
   * @param cb - Callback returning the count
   */
  public countMessages(
    queue: TQueueExtendedParams,
    cb: ICallback<number>,
  ): void {
    this.withMessageBrowser(
      queue,
      (browser, done) => browser.countMessages(queue, done),
      cb,
    );
  }

  /**
   * Retrieves message IDs for a specific page.
   *
   * @param queue - Parsed queue parameters
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @param cb - Callback returning an IBrowserPage of message IDs
   */
  public getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void {
    this.withMessageBrowser(
      queue,
      (browser, done) => browser.getMessageIds(queue, page, pageSize, done),
      cb,
    );
  }

  /**
   * Retrieves detailed messages for a specific page.
   *
   * @param queue - Extended queue parameters
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @param cb - Callback returning an IBrowserPage of IMessageTransferable
   */
  public getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void {
    this.withMessageBrowser(
      queue,
      (browser, done) => browser.getMessages(queue, page, pageSize, done),
      cb,
    );
  }

  /**
   * Purges all messages from the specified queue.
   *
   * This operation is performed asynchronously using a background job. When this method
   * is called, it immediately creates and starts a purge job, and returns the ID of
   * that job. You can use the returned job ID to track the progress of the purge operation.
   *
   * @param {TQueueExtendedParams} queue - The queue to purge.
   * @param {Function} cb - Callback function that receives the job ID.
   */
  public purge(queue: TQueueExtendedParams, cb: ICallback<string>): void {
    this.withMessageBrowser(
      queue,
      (browser, done) => browser.purge(queue, done),
      cb,
    );
  }

  /**
   * Cancels an active purge job that is currently in progress.
   *
   * @param {TQueueExtendedParams} queue - The queue where the purge job is running.
   * @param {string} jobId - The ID of the purge job to cancel.
   * @param {ICallback<void>} cb - Callback when cancellation is processed.
   */
  public cancelPurge(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback,
  ): void {
    this.withMessageBrowser(
      queue,
      (browser, done) => browser.cancelPurge(queue, jobId, done),
      cb,
    );
  }

  /**
   * Retrieves comprehensive details about a specific purge job.
   *
   * @param {TQueueExtendedParams} queue - The queue associated with the purge job.
   * @param {string} jobId - The ID of the purge job to retrieve.
   * @param {ICallback<IBackgroundJob<TPurgeQueueJobTarget>>} cb - Callback with the job object.
   */
  public getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<IBackgroundJob<TPurgeQueueJobTarget>>,
  ): void {
    this.withMessageBrowser(
      queue,
      (browser, done) => browser.getPurgeJob(queue, jobId, done),
      cb,
    );
  }

  /**
   * Retrieves the current status of a purge job.
   *
   * @param {TQueueExtendedParams} queue - The queue where the purge job is running.
   * @param {string} jobId - The ID of the purge job to check.
   * @param {ICallback<EBackgroundJobStatus>} cb - Callback with the job status.
   */
  public getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<EBackgroundJobStatus>,
  ): void {
    this.withMessageBrowser(
      queue,
      (browser, done) => browser.getPurgeJobStatus(queue, jobId, done),
      cb,
    );
  }
}
