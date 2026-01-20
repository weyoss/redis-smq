/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IMessageBrowser } from '../message-browser/types/index.js';
import { QueueAcknowledgedMessages } from '../../queue-acknowledged-messages/index.js';
import { QueueDeadLetteredMessages } from '../../queue-dead-lettered-messages/index.js';
import { QueueScheduledMessages } from '../../queue-scheduled-messages/index.js';
import { QueuePendingMessages } from '../../queue-pending-messages/index.js';
import { QueueMessages } from '../../queue-messages/index.js';
import { EQueueMessagesType } from './queue-messages-types.js';
import { ILogger } from 'redis-smq-common';

export const registry = [
  [EQueueMessagesType.ACKNOWLEDGED, QueueAcknowledgedMessages],
  [EQueueMessagesType.DEAD_LETTERED, QueueDeadLetteredMessages],
  [EQueueMessagesType.SCHEDULED, QueueScheduledMessages],
  [EQueueMessagesType.PENDING, QueuePendingMessages],
  [EQueueMessagesType.ALL_MESSAGES, QueueMessages],
] as const;

export class QueueMessagesRegistry {
  /**
   * Determines the message type from a MessageBrowser instance
   */
  static getQueueType(instance: IMessageBrowser): EQueueMessagesType {
    for (const [key, value] of registry) {
      if (instance instanceof value) return key;
    }
    throw new Error(
      `Unsupported MessageBrowser instance ${instance.constructor.name}`,
    );
  }

  static getMessageBrowser(
    type: EQueueMessagesType,
    logger: ILogger,
  ): IMessageBrowser {
    for (const [key, Ctor] of registry) {
      if (type === key) return new Ctor(logger);
    }
    throw new Error(`Unsupported message type instance ${type}`);
  }
}
