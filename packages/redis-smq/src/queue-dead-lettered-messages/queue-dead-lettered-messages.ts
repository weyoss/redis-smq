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
import { ICallback, ILogger } from 'redis-smq-common';
import { IBrowserPage } from '../common/index.js';
import { IMessageTransferable } from '../message/index.js';
import { Configuration } from '../config/index.js';
import { DeadLetteredMessageAuditNotEnabledError } from '../errors/index.js';
import { EQueueMessagesType } from '../common/queue-messages-registry/queue-messages-types.js';
import { BrowserStorageAbstract } from '../common/message-browser/browser-storage/browser-storage-abstract.js';

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
  protected type = EQueueMessagesType.DEAD_LETTERED;
  protected readonly redisKey = 'keyQueueDL';

  protected geMessageStorage(logger: ILogger): BrowserStorageAbstract {
    return new BrowserStorageList(logger);
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
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.deadLetteredMessages.enabled)
      return cb(new DeadLetteredMessageAuditNotEnabledError());
    super.getMessages(queue, page, pageSize, cb);
  }

  /**
   * Purges all audited dead-lettered messages from the specified queue.
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
   * @throws DeadLetteredMessageAuditNotEnabledError
   */
  override purge(queue: TQueueExtendedParams, cb: ICallback<string>) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.deadLetteredMessages.enabled)
      return cb(new DeadLetteredMessageAuditNotEnabledError());
    super.purge(queue, cb);
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
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.deadLetteredMessages.enabled)
      return cb(new DeadLetteredMessageAuditNotEnabledError());
    super.countMessages(queue, cb);
  }
}
