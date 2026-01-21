/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  IQueueParams,
  QueuePendingMessages,
  TQueueExtendedParams,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export class QueuePendingMessagesService {
  protected queuePendingMessages;

  constructor(queuePendingMessages: QueuePendingMessages) {
    this.queuePendingMessages = promisifyAll(queuePendingMessages);
  }

  getMessages(
    queueParams: TQueueExtendedParams,
    page: number,
    pageSize: number,
  ) {
    return this.queuePendingMessages.getMessagesAsync(
      queueParams,
      page,
      pageSize,
    );
  }

  async purge(queueParams: IQueueParams) {
    await this.queuePendingMessages.purgeAsync(queueParams);
    await bluebird.delay(5000);
  }

  async countMessagesAsync(queueParams: IQueueParams, groupId?: string) {
    const params: TQueueExtendedParams = groupId
      ? { queueParams, groupId }
      : queueParams;
    return this.queuePendingMessages.countMessagesAsync(params);
  }
}
