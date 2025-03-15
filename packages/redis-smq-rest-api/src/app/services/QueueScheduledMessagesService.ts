/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, QueueScheduledMessages } from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueueScheduledMessagesService {
  protected queueScheduledMessages;

  constructor(queueScheduledMessages: QueueScheduledMessages) {
    this.queueScheduledMessages = promisifyAll(queueScheduledMessages);
  }

  getMessages(queueParams: IQueueParams, cursor: number, pageSize: number) {
    return this.queueScheduledMessages.getMessagesAsync(
      queueParams,
      cursor,
      pageSize,
    );
  }

  async purge(queueParams: IQueueParams) {
    return this.queueScheduledMessages.purgeAsync(queueParams);
  }

  async countMessagesAsync(queueParams: IQueueParams) {
    return this.queueScheduledMessages.countMessagesAsync(queueParams);
  }
}
