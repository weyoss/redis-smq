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
import { AcknowledgedMessageAuditNotEnabledError } from '../errors/index.js';
import { BrowserStorageAbstract } from '../common/message-browser/browser-storage/browser-storage-abstract.js';
import { EQueueMessageType } from '../common/index.js';

/**
 * Manages acknowledged messages in a queue.
 *
 * Acknowledged messages are those that have been successfully processed by consumers
 * and can be safely removed from the active queue. This class allows for tracking
 * and management of these messages when the system is configured to audit them.
 *
 * @extends MessageBrowserAbstract
 * @see /packages/redis-smq/docs/configuration.md#message-audit
 */
export class QueueAcknowledgedMessages extends MessageBrowserAbstract {
  protected readonly redisKey = 'keyQueueAcknowledged';
  readonly messageType = EQueueMessageType.ACKNOWLEDGED;

  protected createDefaultStorage(): BrowserStorageAbstract {
    return new BrowserStorageList(this.logger);
  }

  /**
   * Retrieves audited acknowledged messages.
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
   * @throws AcknowledgedMessageAuditNotEnabledError
   */
  override getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.acknowledgedMessages.enabled)
      return cb(new AcknowledgedMessageAuditNotEnabledError());
    super.getMessages(queue, page, pageSize, cb);
  }

  /**
   * Purges all audited acknowledged messages from the specified queue.
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
   * @throws AcknowledgedMessageAuditNotEnabledError
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
   * @throws BackgroundJobTargetLockedError
   */
  override purge(queue: TQueueExtendedParams, cb: ICallback<string>) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.acknowledgedMessages.enabled)
      return cb(new AcknowledgedMessageAuditNotEnabledError());
    super.purge(queue, cb);
  }

  /**
   * Counts the total number of audited acknowledged messages.
   *
   * @param queue - Extended queue parameters
   * @param cb - Callback returning the count
   *
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
   * @throws AcknowledgedMessageAuditNotEnabledError
   */
  override countMessages(queue: TQueueExtendedParams, cb: ICallback<number>) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.acknowledgedMessages.enabled)
      return cb(new AcknowledgedMessageAuditNotEnabledError());
    super.countMessages(queue, cb);
  }
}
