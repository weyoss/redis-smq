import { promisifyAll } from 'bluebird';
import { TGetMessagesReply } from '../../../types';
import { GetScheduledMessagesRequestDTO as GetSchedulerMessagesDTO } from '../controllers/scheduled-messages/get-scheduled-messages/get-scheduled-messages-request.DTO';
import { DeleteScheduledMessageRequestDTO as DeletedScheduledMessageDTO } from '../controllers/scheduled-messages/delete-scheduled-message/delete-scheduled-message-request.DTO';
import { MessageManager } from '../../system/message-manager/message-manager';
import { GetPendingMessagesRequestDTO } from '../controllers/messages/actions/get-pending-messages/get-pending-messages-request.DTO';
import { GetAcknowledgedMessagesRequestDTO } from '../controllers/messages/actions/get-acknowledged-messages/get-acknowledged-messages-request.DTO';
import { GetPendingMessagesWithPriorityRequestDTO } from '../controllers/messages/actions/get-pending-messages-with-priority/get-pending-messages-with-priority-request.DTO';
import { GetDeadLetteredMessagesRequestDTO } from '../controllers/messages/actions/get-dead-lettered-messages/get-dead-lettered-messages-request.DTO';
import { DeletePendingMessageRequestDTO } from '../controllers/messages/actions/delete-pending-message/delete-pending-message-request.DTO';
import { DeleteAcknowledgedMessageRequestDTO } from '../controllers/messages/actions/delete-acknowledged-message/delete-acknowledged-message-request.DTO';
import { DeleteDeadLetteredMessageRequestDTO } from '../controllers/messages/actions/delete-dead-lettered-message/delete-dead-lettered-message-request.DTO';
import { DeletePendingMessageWithPriorityRequestDTO } from '../controllers/messages/actions/delete-pending-message-with-priority/delete-pending-message-with-priority-request.DTO';

const messageManagerAsync = promisifyAll(MessageManager.prototype);

export class MessageManagerService {
  protected messageManager: typeof messageManagerAsync;

  constructor(messageManager: MessageManager) {
    this.messageManager = promisifyAll(messageManager);
  }

  async getScheduledMessages(
    args: GetSchedulerMessagesDTO,
  ): Promise<TGetMessagesReply> {
    const { skip = 0, take = 1 } = args;
    return this.messageManager.getScheduledMessagesAsync(skip, take);
  }

  async getPendingMessages(
    args: GetPendingMessagesRequestDTO,
  ): Promise<TGetMessagesReply> {
    const { queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getPendingMessagesAsync(queueName, skip, take);
  }

  async getAcknowledgedMessages(
    args: GetAcknowledgedMessagesRequestDTO,
  ): Promise<TGetMessagesReply> {
    const { queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getAcknowledgedMessagesAsync(
      queueName,
      skip,
      take,
    );
  }

  async getPendingMessagesWithPriority(
    args: GetPendingMessagesWithPriorityRequestDTO,
  ): Promise<TGetMessagesReply> {
    const { queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getPendingMessagesWithPriorityAsync(
      queueName,
      skip,
      take,
    );
  }

  async getDeadLetteredMessages(
    args: GetDeadLetteredMessagesRequestDTO,
  ): Promise<TGetMessagesReply> {
    const { queueName, skip = 0, take = 1 } = args;
    return this.messageManager.getDeadLetteredMessagesAsync(
      queueName,
      skip,
      take,
    );
  }

  async deletePendingMessage(
    args: DeletePendingMessageRequestDTO,
  ): Promise<void> {
    const { queueName, id, sequenceId } = args;
    return this.messageManager.deletePendingMessageAsync(
      queueName,
      sequenceId,
      id,
    );
  }

  async deletePendingMessageWithPriority(
    args: DeletePendingMessageWithPriorityRequestDTO,
  ): Promise<void> {
    const { queueName, id, sequenceId } = args;
    return this.messageManager.deletePendingMessageWithPriorityAsync(
      queueName,
      sequenceId,
      id,
    );
  }

  async deleteAcknowledgedMessage(
    args: DeleteAcknowledgedMessageRequestDTO,
  ): Promise<void> {
    const { queueName, id, sequenceId } = args;
    return this.messageManager.deleteAcknowledgedMessageAsync(
      queueName,
      sequenceId,
      id,
    );
  }

  async deleteDeadLetteredMessage(
    args: DeleteDeadLetteredMessageRequestDTO,
  ): Promise<void> {
    const { queueName, id, sequenceId } = args;
    return this.messageManager.deleteDeadLetterMessageAsync(
      queueName,
      sequenceId,
      id,
    );
  }

  async deleteScheduledMessage(
    args: DeletedScheduledMessageDTO,
  ): Promise<void> {
    const { id, sequenceId } = args;
    return this.messageManager.deleteScheduledMessageAsync(sequenceId, id);
  }
}
