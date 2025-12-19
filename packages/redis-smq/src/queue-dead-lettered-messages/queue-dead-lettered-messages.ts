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
import { MessageManager } from '../message-manager/index.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import { ICallback } from 'redis-smq-common';
import { IBrowserPage } from '../common/index.js';
import { IMessageTransferable } from '../message/index.js';
import { Configuration } from '../config/index.js';
import { DeadLetteredMessageAuditNotEnabledError } from '../errors/index.js';

/**
 * Manages dead-lettered messages in a queue.
 *
 * Dead-lettered messages are those that have failed processing multiple times
 * and exceeded their retry limits.  When the system is configured to audit them,
 * these messages are moved to a dead-letter queue for later inspection, troubleshooting, or manual reprocessing.
 *
 * @extends MessageBrowserAbstract
 * @see /packages/redis-smq/docs/configuration.md#message-audit
 */
export class QueueDeadLetteredMessages extends MessageBrowserAbstract {
  constructor() {
    super(new BrowserStorageList(), new MessageManager(), 'keyQueueDL');
    this.logger.debug('QueueDeadLetteredMessages initialized');
  }

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

  override purge(queue: TQueueExtendedParams, cb: ICallback) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.deadLetteredMessages.enabled)
      return cb(new DeadLetteredMessageAuditNotEnabledError());
    super.purge(queue, cb);
  }

  override countMessages(queue: TQueueExtendedParams, cb: ICallback<number>) {
    const cfg = Configuration.getConfig();
    if (!cfg.messageAudit.deadLetteredMessages.enabled)
      return cb(new DeadLetteredMessageAuditNotEnabledError());
    super.countMessages(queue, cb);
  }
}
