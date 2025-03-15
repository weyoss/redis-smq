/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, QueueMessages } from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueueMessagesService {
  protected queueMessages;

  constructor(queueMessages: QueueMessages) {
    this.queueMessages = promisifyAll(queueMessages);
  }

  getMessages(queueParams: IQueueParams, cursor: number, pageSize: number) {
    return this.queueMessages.getMessagesAsync(queueParams, cursor, pageSize);
  }

  async countMessagesAsync(queueParams: IQueueParams) {
    return this.queueMessages.countMessagesAsync(queueParams);
  }

  async purge(queueParams: IQueueParams) {
    return this.queueMessages.purgeAsync(queueParams);
  }

  async countMessagesByStatus(queueParams: IQueueParams) {
    return this.queueMessages.countMessagesByStatusAsync(queueParams);
  }
}
