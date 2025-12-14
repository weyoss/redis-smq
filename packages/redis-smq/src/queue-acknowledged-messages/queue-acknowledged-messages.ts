/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageBrowserAbstract } from '../common/message-browser/message-browser-abstract.js';
import { BrowserStorageList } from '../common/message-browser/browser-storage/browser-storage-list.js';
import { MessageManager } from '../message-manager/index.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import { ICallback } from 'redis-smq-common';
import { IBrowserPage } from '../common/index.js';
import { IMessageTransferable } from '../message/index.js';
import { Configuration } from '../config/index.js';
import { AcknowledgedMessageAuditNotEnabledError } from '../errors/index.js';

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
  constructor() {
    super(
      new BrowserStorageList(),
      new MessageManager(),
      'keyQueueAcknowledged',
    );
    this.logger.debug('QueueAcknowledgedMessages initialized');
  }

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

  override purge(queue: TQueueExtendedParams, cb: ICallback) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.acknowledgedMessages.enabled)
      return cb(new AcknowledgedMessageAuditNotEnabledError());
    super.purge(queue, cb);
  }

  override countMessages(queue: TQueueExtendedParams, cb: ICallback<number>) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.acknowledgedMessages.enabled)
      return cb(new AcknowledgedMessageAuditNotEnabledError());
    super.countMessages(queue, cb);
  }
}
