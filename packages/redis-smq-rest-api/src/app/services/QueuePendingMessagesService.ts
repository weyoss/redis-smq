/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, QueuePendingMessages } from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueuePendingMessagesService {
  protected queuePendingMessages;

  constructor(queuePendingMessages: QueuePendingMessages) {
    this.queuePendingMessages = promisifyAll(queuePendingMessages);
  }

  getMessages(queueParams: IQueueParams, cursor: number, pageSize: number) {
    return this.queuePendingMessages.getMessagesAsync(
      queueParams,
      cursor,
      pageSize,
    );
  }

  async purge(queueParams: IQueueParams) {
    return this.queuePendingMessages.purgeAsync(queueParams);
  }

  async countMessagesAsync(queueParams: IQueueParams) {
    return this.queuePendingMessages.countMessagesAsync(queueParams);
  }
}
