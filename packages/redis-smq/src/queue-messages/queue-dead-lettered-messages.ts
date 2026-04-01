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
 * Manages audited dead-lettered messages in a queue.
 *
 * Dead-lettered messages are those that have failed processing multiple times
 * and exceeded their retry limits. When the system is configured to audit them,
 * these messages are moved to a dead-letter queue for later inspection,
 * troubleshooting, or manual reprocessing.
 *
 * @see /packages/redis-smq/docs/configuration.md#message-audit
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
