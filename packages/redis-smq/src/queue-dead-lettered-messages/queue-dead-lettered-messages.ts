/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageBrowserAbstract } from '../common/message-browser/message-browser-abstract.js';
import { BrowserStorageList } from '../common/message-browser/browser-storage/browser-storage-list.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import { ICallback } from 'redis-smq-common';
import { IBrowserPage } from '../common/index.js';
import { IMessageTransferable } from '../message/index.js';
import { Configuration } from '../config/index.js';
import { DeadLetteredMessageAuditNotEnabledError } from '../errors/index.js';
import { IBrowserStorage } from '../common/message-browser/browser-storage/browser-storage-abstract.js';
import { EQueueMessageType } from '../common/index.js';

/**
 * Manages audited dead-lettered messages in a queue.
 *
 * Dead-lettered messages are those that have failed processing multiple times
 * and exceeded their retry limits. When the system is configured to audit them,
 * these messages are moved to a dead-letter queue for later inspection, troubleshooting, or manual reprocessing.
 *
 * @extends MessageBrowserAbstract
 * @see /packages/redis-smq/docs/configuration.md#message-audit
 */
export class QueueDeadLetteredMessages extends MessageBrowserAbstract {
  protected readonly redisKey = 'keyQueueDL';
  readonly messageType = EQueueMessageType.DEAD_LETTERED;

  protected createDefaultStorage(): IBrowserStorage {
    return new BrowserStorageList(this.logger);
  }

  protected withValidatedAuditConfiguration<T>(
    operation: (cb: ICallback<T>) => void,
    cb: ICallback<T>,
  ) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.deadLetteredMessages.enabled) {
      this.logger.error(`Dead-lettered message audit is not enabled`);
      return cb(new DeadLetteredMessageAuditNotEnabledError());
    }
    operation(cb);
  }

  /**
   * Retrieves audited dead-lettered messages from the specified queue.
   *
   * @param queue - Extended queue parameters
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @param cb - Callback returning an IQueueMessagesPage of IMessageTransferable
   *
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
   * @throws DeadLetteredMessageAuditNotEnabledError
   */
  override getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ) {
    this.withValidatedAuditConfiguration((cb) => {
      super.getMessages(queue, page, pageSize, cb);
    }, cb);
  }

  /**
   * Purges all audited dead-lettered messages from the specified queue.
   *
   * This operation is performed asynchronously using a background job. When this method
   * is called, it immediately creates and starts a purge job, and returns the ID of
   * that job. You can use the returned job ID to track the progress of the purge operation.
   *
   * @param {string|Object} queue - The queue to purge. Can be a string (queue name),
   *                                queue parameters object, or queue consumer group parameters.
   * @param {Function} cb - Callback function that will be invoked when the job is created.
   *                        The callback receives two parameters:
   *                        - `error` {Error|null} - If an error occurs during job creation,
   *                          this will contain the Error object. If the job is successfully
   *                          created, this will be `null`.
   *                        - `jobId` {string|undefined} - The ID of the background job created
   *                          to perform the purge operation. This ID can be used to:
   *                          - Check the job status using `getPurgeJobStatus()`
   *                          - Monitor progress via `getPurgeJob()`
   *                          - Cancel the purge job if needed using `cancelPurge()`
   *
   *                          Note: Receiving a job ID does NOT mean the purge is complete,
   *                          only that the purge job has been successfully created and started.
   *
   * @throws DeadLetteredMessageAuditNotEnabledError
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
   * @throws BackgroundJobTargetLockedError
   */
  override purge(queue: TQueueExtendedParams, cb: ICallback<string>) {
    this.withValidatedAuditConfiguration((cb) => {
      super.purge(queue, cb);
    }, cb);
  }

  /**
   * Counts the total number of audited dead-lettered messages in the queue.
   *
   * @param queue - Extended queue parameters
   * @param cb - Callback returning the count
   *
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
   * @throws DeadLetteredMessageAuditNotEnabledError
   */
  override countMessages(queue: TQueueExtendedParams, cb: ICallback<number>) {
    this.withValidatedAuditConfiguration((cb) => {
      super.countMessages(queue, cb);
    }, cb);
  }
}
