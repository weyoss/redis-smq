/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, QueueAcknowledgedMessages } from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueueAcknowledgedMessagesService {
  protected queueAcknowledgedMessages;

  constructor(queueAcknowledgedMessages: QueueAcknowledgedMessages) {
    this.queueAcknowledgedMessages = promisifyAll(queueAcknowledgedMessages);
  }

  getMessages(queueParams: IQueueParams, cursor: number, pageSize: number) {
    return this.queueAcknowledgedMessages.getMessagesAsync(
      queueParams,
      cursor,
      pageSize,
    );
  }

  async purge(queueParams: IQueueParams) {
    return this.queueAcknowledgedMessages.purgeAsync(queueParams);
  }

  async countMessagesAsync(queueParams: IQueueParams) {
    return this.queueAcknowledgedMessages.countMessagesAsync(queueParams);
  }
}
