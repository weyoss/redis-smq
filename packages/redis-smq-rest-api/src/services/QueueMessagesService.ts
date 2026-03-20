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
  QueueAcknowledgedMessages,
  QueueDeadLetteredMessages,
  QueuePendingMessages,
  QueuePublishedMessages,
  QueueScheduledMessages,
} from 'redis-smq';
import { GetQueueMessagesControllerRequestQueryDTO } from '../controllers/namespaces/namespace/queues/queue/messages/GetQueueMessagesControllerRequestQueryDTO.js';
import { CountQueueMessagesControllerRequestQueryDTO } from '../controllers/namespaces/namespace/queues/queue/messages/CountQueueMessagesControllerRequestQueryDTO.js';
import { PurgeQueueMessagesControllerRequestQueryDTO } from '../controllers/namespaces/namespace/queues/queue/messages/PurgeQueueMessagesControllerRequestQueryDTO.js';

const { promisifyAll } = bluebird;

export class QueueMessagesService {
  protected queuePublishedMessages;
  protected queueScheduledMessages;
  protected queueAcknowledgedMessages;
  protected queuePendingMessages;
  protected queueDeadLetteredMessages;

  constructor(
    queuePublishedMessages: QueuePublishedMessages,
    queueScheduledMessages: QueueScheduledMessages,
    queueAcknowledgedMessages: QueueAcknowledgedMessages,
    queuePendingMessages: QueuePendingMessages,
    queueDeadLetteredMessages: QueueDeadLetteredMessages,
  ) {
    this.queuePublishedMessages = promisifyAll(queuePublishedMessages);
    this.queueScheduledMessages = promisifyAll(queueScheduledMessages);
    this.queueAcknowledgedMessages = promisifyAll(queueAcknowledgedMessages);
    this.queueDeadLetteredMessages = promisifyAll(queueDeadLetteredMessages);
    this.queuePendingMessages = promisifyAll(queuePendingMessages);
  }

  protected getMessageBrowser(
    status: GetQueueMessagesControllerRequestQueryDTO['status'],
  ) {
    if (status === 'pending') return this.queuePendingMessages;
    if (status === 'dead-lettered') return this.queueDeadLetteredMessages;
    if (status === 'acknowledged') return this.queueAcknowledgedMessages;
    if (status === 'scheduled') return this.queueScheduledMessages;
    return this.queuePublishedMessages;
  }

  getMessages(
    queueParams: IQueueParams,
    params: GetQueueMessagesControllerRequestQueryDTO,
  ) {
    const { page, pageSize, status } = params;
    return this.getMessageBrowser(status).getMessagesAsync(
      queueParams,
      page,
      pageSize,
    );
  }

  async countMessages(
    queue: IQueueParams,
    params: CountQueueMessagesControllerRequestQueryDTO,
  ) {
    const { status, groupBy } = params;
    if (groupBy === 'status') {
      return this.queuePublishedMessages.countMessagesByStatusAsync(queue);
    }
    return this.getMessageBrowser(status).countMessagesAsync(queue);
  }

  async purge(
    queueParams: IQueueParams,
    params: PurgeQueueMessagesControllerRequestQueryDTO,
  ) {
    return this.getMessageBrowser(params.status).purgeAsync(queueParams);
  }
}
