import { promisifyAll } from 'bluebird';
import {
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TGetScheduledMessagesReply,
} from '../../../types';
import { MessageManager } from '../../system/message-manager/message-manager';
import { GetScheduledMessagesRequestDTO } from '../controllers/api/main/scheduled-messages/get-scheduled-messages/get-scheduled-messages.request.DTO';
import { GetPendingMessagesRequestDTO } from '../controllers/api/queues/queue/pending-messages/get-pending-messages/get-pending-messages.request.DTO';
import { GetAcknowledgedMessagesRequestDTO } from '../controllers/api/queues/queue/acknowledged-messages/get-acknowledged-messages/get-acknowledged-messages.request.DTO';
import { GetDeadLetteredMessagesRequestDTO } from '../controllers/api/queues/queue/dead-lettered-messages/get-dead-lettered-messages/get-dead-lettered-messages.request.DTO';
import { DeletePendingMessageRequestDTO } from '../controllers/api/queues/queue/pending-messages/delete-pending-message/delete-pending-message.request.DTO';
import { DeletePendingMessageWithPriorityRequestDTO } from '../controllers/api/queues/queue/pending-messages-with-priority/delete-pending-message-with-priority/delete-pending-message-with-priority.request.DTO';
import { DeleteAcknowledgedMessageRequestDTO } from '../controllers/api/queues/queue/acknowledged-messages/delete-acknowledged-message/delete-acknowledged-message.request.DTO';
import { DeleteDeadLetteredMessageRequestDTO } from '../controllers/api/queues/queue/dead-lettered-messages/delete-dead-lettered-message/delete-dead-lettered-message.request.DTO';
import { DeleteScheduledMessageRequestDTO } from '../controllers/api/main/scheduled-messages/delete-scheduled-message/delete-scheduled-message-request.DTO';
import { RequeueDeadLetteredMessageRequestDTO } from '../controllers/api/queues/queue/dead-lettered-messages/requeue-dead-lettered-message/requeue-dead-lettered-message.request.DTO';
import { RequeueAcknowledgedMessageRequestDTO } from '../controllers/api/queues/queue/acknowledged-messages/requeue-acknowledged-message/requeue-acknowledged-message.request.DTO';

const messageManagerAsync = promisifyAll(MessageManager.prototype);

export class MessagesService {
  protected messageManager: typeof messageManagerAsync;

  constructor(messageManager: MessageManager) {
    this.messageManager = promisifyAll(messageManager);
  }

  async getScheduledMessages(
    args: GetScheduledMessagesRequestDTO,
  ): Promise<TGetScheduledMessagesReply> {
    const { skip = 0, take = 1 } = args;
    return this.messageManager.getScheduledMessagesAsync(skip, take);
  }

  async getPendingMessages(
    args: GetPendingMessagesRequestDTO,
  ): Promise<TGetMessagesReply> {
    const { ns, queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getPendingMessagesAsync(
      {
        name: queueName,
        ns,
      },
      skip,
      take,
    );
  }

  async getAcknowledgedMessages(
    args: GetAcknowledgedMessagesRequestDTO,
  ): Promise<TGetMessagesReply> {
    const { ns, queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getAcknowledgedMessagesAsync(
      {
        name: queueName,
        ns,
      },
      skip,
      take,
    );
  }

  async getPendingMessagesWithPriority(
    args: GetPendingMessagesRequestDTO,
  ): Promise<TGetPendingMessagesWithPriorityReply> {
    const { ns, queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getPendingMessagesWithPriorityAsync(
      {
        name: queueName,
        ns,
      },
      skip,
      take,
    );
  }

  async getDeadLetteredMessages(
    args: GetDeadLetteredMessagesRequestDTO,
  ): Promise<TGetMessagesReply> {
    const { ns, queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getDeadLetteredMessagesAsync(
      {
        name: queueName,
        ns,
      },
      skip,
      take,
    );
  }

  async deletePendingMessage(
    args: DeletePendingMessageRequestDTO,
  ): Promise<void> {
    const { ns, queueName, id, sequenceId } = args;
    return this.messageManager.deletePendingMessageAsync(
      {
        name: queueName,
        ns,
      },
      sequenceId,
      id,
    );
  }

  async deletePendingMessageWithPriority(
    args: DeletePendingMessageWithPriorityRequestDTO,
  ): Promise<void> {
    const { ns, queueName, id } = args;
    return this.messageManager.deletePendingMessageWithPriorityAsync(
      {
        name: queueName,
        ns,
      },
      id,
    );
  }

  async deleteAcknowledgedMessage(
    args: DeleteAcknowledgedMessageRequestDTO,
  ): Promise<void> {
    const { ns, queueName, id, sequenceId } = args;
    return this.messageManager.deleteAcknowledgedMessageAsync(
      {
        name: queueName,
        ns,
      },
      sequenceId,
      id,
    );
  }

  async deleteDeadLetteredMessage(
    args: DeleteDeadLetteredMessageRequestDTO,
  ): Promise<void> {
    const { ns, queueName, id, sequenceId } = args;
    return this.messageManager.deleteDeadLetterMessageAsync(
      {
        name: queueName,
        ns,
      },
      sequenceId,
      id,
    );
  }

  async deleteScheduledMessage(
    args: DeleteScheduledMessageRequestDTO,
  ): Promise<void> {
    const { id } = args;
    return this.messageManager.deleteScheduledMessageAsync(id);
  }

  async requeueDeadLetteredMessage(
    args: RequeueDeadLetteredMessageRequestDTO,
  ): Promise<void> {
    const { ns, queueName, id, sequenceId, priority } = args;
    return this.messageManager.requeueMessageFromDLQueueAsync(
      {
        name: queueName,
        ns,
      },
      sequenceId,
      id,
      priority,
    );
  }

  async requeueAcknowledgedMessage(
    args: RequeueAcknowledgedMessageRequestDTO,
  ): Promise<void> {
    const { ns, queueName, id, sequenceId, priority } = args;
    return this.messageManager.requeueMessageFromAcknowledgedQueueAsync(
      {
        name: queueName,
        ns,
      },
      sequenceId,
      id,
      priority,
    );
  }
}
