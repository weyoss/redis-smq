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
import { Configuration } from '../config-manager/configuration.js';
import { DeadLetterAuditDisabledError } from '../errors/index.js';

/**
 * Handles dead-lettered message operations for a queue.
 *
 * Dead-lettered messages are those that failed processing and exceeded retry limits.
 * Requires message audit to be enabled in configuration.
 *
 * @example
 * const deadLettered = new QueueDeadLetteredMessages();
 *
 * // Count dead-lettered messages
 * const count = await deadLettered.countMessages('orders');
 *
 * // Get first page of dead-lettered messages
 * const page = await deadLettered.getMessages('orders', 1, 20);
 * page.items.forEach(msg => {
 *   console.log(`Failed message: ${msg.getId()}`);
 * });
 *
 * // Purge all dead-lettered messages
 * const jobId = await deadLettered.purge('orders');
 */
export class QueueDeadLetteredMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.DEAD_LETTERED;

  protected override withMessageBrowser<T>(
    queue: TQueueExtendedParams,
    operation: (browser: IMessageBrowser, cb: ICallback<T>) => void,
    cb: ICallback<T>,
  ) {
    super.withMessageBrowser(
      queue,
      (browser: IMessageBrowser, cb: ICallback<T>) => {
        const cfg = Configuration.getConfig();
        if (!cfg.messageAudit.deadLetteredMessages.enabled) {
          this.logger.error(`Dead-lettered message audit is not enabled`);
          return cb(new DeadLetterAuditDisabledError());
        }
        operation(browser, cb);
      },
      cb,
    );
  }
}
