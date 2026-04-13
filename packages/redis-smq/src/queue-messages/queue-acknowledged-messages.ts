/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueMessagesAbstract } from './queue-messages-abstract.js';
import { EQueueMessageType } from './types/index.js';
import { TQueueExtendedParams } from '../queue-manager/index.js';
import { IMessageBrowser } from './message-browser/types/index.js';
import { ICallback } from 'redis-smq-common';
import { AcknowledgmentAuditDisabledError } from '../errors/index.js';
import { Configuration } from '../config-manager/configuration.js';

/**
 * Handles acknowledged message operations for a queue.
 *
 * Acknowledged messages are those that have been successfully processed.
 * Requires message audit to be enabled in configuration.
 *
 * @example
 * const acknowledged = new QueueAcknowledgedMessages();
 *
 * // Count acknowledged messages
 * const count = await acknowledged.countMessages('orders');
 *
 * // Get first page of acknowledged messages
 * const page = await acknowledged.getMessages('orders', 1, 20);
 * page.items.forEach(msg => {
 *   console.log(`Processed message: ${msg.getId()}`);
 * });
 *
 * // Purge all acknowledged messages
 * const jobId = await acknowledged.purge('orders');
 */
export class QueueAcknowledgedMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.ACKNOWLEDGED;

  protected override withMessageBrowser<T>(
    queue: TQueueExtendedParams,
    operation: (browser: IMessageBrowser, cb: ICallback<T>) => void,
    cb: ICallback<T>,
  ) {
    super.withMessageBrowser(
      queue,
      (browser: IMessageBrowser, cb: ICallback<T>) => {
        const cfg = Configuration.getConfig();
        if (!cfg.messageAudit.acknowledgedMessages.enabled) {
          this.logger.error(`Acknowledged message audit is not enabled`);
          return cb(new AcknowledgmentAuditDisabledError());
        }
        operation(browser, cb);
      },
      cb,
    );
  }
}
