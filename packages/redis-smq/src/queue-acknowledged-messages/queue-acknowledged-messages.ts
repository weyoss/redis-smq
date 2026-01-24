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
   * Purges all audited acknowledged messages.
   *
   * @param queue - The queue to purge. Can be a string, queue parameters object,
   *                or queue consumer group parameters.
   * @param cb - Callback function that will be invoked when the operation completes.
   *             If an error occurs, the first parameter will contain the Error object.
   *             Otherwise, the first parameter will be the ID of purge job created.
   *
   * @throws InvalidQueueParametersError
   * @throws ConsumerGroupRequiredError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueNotFoundError
   * @throws AcknowledgedMessageAuditNotEnabledError
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
