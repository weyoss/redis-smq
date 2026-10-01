/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IQueueAcknowledgedMessages,
  IQueueDeadLetteredMessages,
  IQueueParams,
  IQueuePendingMessages,
  IQueuePublishedMessages,
  IQueueScheduledMessages,
} from 'redis-smq';
import { GetQueueMessagesControllerRequestQueryDTO } from '../controllers/namespaces/namespace/queues/queue/messages/GetQueueMessagesControllerRequestQueryDTO.js';
import { CountQueueMessagesControllerRequestQueryDTO } from '../controllers/namespaces/namespace/queues/queue/messages/CountQueueMessagesControllerRequestQueryDTO.js';
import { PurgeQueueMessagesControllerRequestQueryDTO } from '../controllers/namespaces/namespace/queues/queue/messages/PurgeQueueMessagesControllerRequestQueryDTO.js';

export class QueueMessagesService {
  constructor(
    protected queuePublishedMessages: IQueuePublishedMessages,
    protected queueScheduledMessages: IQueueScheduledMessages,
    protected queueAcknowledgedMessages: IQueueAcknowledgedMessages,
    protected queuePendingMessages: IQueuePendingMessages,
    protected queueDeadLetteredMessages: IQueueDeadLetteredMessages,
  ) {}

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
    return this.getMessageBrowser(status).getMessages(
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
      return this.queuePublishedMessages.countMessagesByStatus(queue);
    }
    return this.getMessageBrowser(status).countMessages(queue);
  }

  async purge(
    queueParams: IQueueParams,
    params: PurgeQueueMessagesControllerRequestQueryDTO,
  ) {
    return this.getMessageBrowser(params.status).purge(queueParams);
  }
}
