import { TGetScheduledMessagesReply } from '../../../types';
import { GetScheduledMessagesRequestDTO as GetSchedulerMessagesDTO } from '../controllers/scheduler/actions/get-scheduled-messages/get-scheduled-messages-request.DTO';
import { DeleteScheduledMessageRequestDTO as DeletedScheduledMessageDTO } from '../controllers/scheduler/actions/delete-scheduled-message/delete-scheduled-message-request.DTO';
import { MessageManager } from '../../system/message-manager/message-manager';

export class MessageManagerService {
  protected messageManager: MessageManager;

  constructor(messageManager: MessageManager) {
    this.messageManager = messageManager;
  }

  async getScheduledMessages(
    args: GetSchedulerMessagesDTO,
  ): Promise<TGetScheduledMessagesReply> {
    const { skip = 0, take = 1 } = args;
    return new Promise<TGetScheduledMessagesReply>((resolve, reject) => {
      this.messageManager.getScheduledMessages(skip, take, (err, reply) => {
        if (err) reject(err);
        else if (!reply) reject();
        else resolve(reply);
      });
    });
  }

  async deleteScheduledMessage(
    args: DeletedScheduledMessageDTO,
  ): Promise<void> {
    const { id, index } = args;
    return new Promise<void>((resolve, reject) => {
      this.messageManager.deleteScheduledMessage(index, id, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
