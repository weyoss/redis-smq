/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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

  getMessages(queueParams: IQueueParams, page: number, pageSize: number) {
    return this.queueScheduledMessages.getMessagesAsync(
      queueParams,
      page,
      pageSize,
    );
  }

  async purge(queueParams: IQueueParams) {
    await this.queueScheduledMessages.purgeAsync(queueParams);
    await bluebird.delay(5000);
  }

  async countMessagesAsync(queueParams: IQueueParams) {
    return this.queueScheduledMessages.countMessagesAsync(queueParams);
  }
}
