/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, QueueDeadLetteredMessages } from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueueDeadLetteredMessagesService {
  protected queueDeadLetteredMessages;

  constructor(queueDeadLetteredMessages: QueueDeadLetteredMessages) {
    this.queueDeadLetteredMessages = promisifyAll(queueDeadLetteredMessages);
  }

  getMessages(queueParams: IQueueParams, page: number, pageSize: number) {
    return this.queueDeadLetteredMessages.getMessagesAsync(
      queueParams,
      page,
      pageSize,
    );
  }

  async purge(queueParams: IQueueParams) {
    return this.queueDeadLetteredMessages.purgeAsync(queueParams);
  }

  async countMessagesAsync(queueParams: IQueueParams) {
    return this.queueDeadLetteredMessages.countMessagesAsync(queueParams);
  }
}
