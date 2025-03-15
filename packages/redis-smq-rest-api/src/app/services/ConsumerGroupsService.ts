/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ConsumerGroups, IQueueParams, QueuePendingMessages } from 'redis-smq';

const { promisifyAll } = bluebird;

export class ConsumerGroupsService {
  protected consumerGroups;
  protected queuePendingMessages;

  constructor(
    consumerGroups: ConsumerGroups,
    queuePendingMessages: QueuePendingMessages,
  ) {
    this.consumerGroups = promisifyAll(consumerGroups);
    this.queuePendingMessages = promisifyAll(queuePendingMessages);
  }

  async deleteConsumerGroup(
    queueParams: IQueueParams,
    consumerGroupId: string,
  ) {
    await this.consumerGroups.deleteConsumerGroupAsync(
      queueParams,
      consumerGroupId,
    );
  }

  async getConsumerGroups(queueParams: IQueueParams) {
    return this.consumerGroups.getConsumerGroupsAsync(queueParams);
  }

  async saveConsumerGroup(queueParams: IQueueParams, consumerGroupId: string) {
    await this.consumerGroups.saveConsumerGroupAsync(
      queueParams,
      consumerGroupId,
    );
  }

  async getPendingMessages(
    queueParams: IQueueParams,
    consumerGroupId: string,
    cursor: number,
    pageSize: number,
  ) {
    return this.queuePendingMessages.getMessagesAsync(
      {
        queue: queueParams,
        groupId: consumerGroupId,
      },
      cursor,
      pageSize,
    );
  }

  async countPendingMessages(
    queueParams: IQueueParams,
    consumerGroupId: string,
  ) {
    return this.queuePendingMessages.countMessagesAsync({
      queue: queueParams,
      groupId: consumerGroupId,
    });
  }

  async purgePendingMessages(
    queueParams: IQueueParams,
    consumerGroupId: string,
  ) {
    return this.queuePendingMessages.purgeAsync({
      queue: queueParams,
      groupId: consumerGroupId,
    });
  }
}
