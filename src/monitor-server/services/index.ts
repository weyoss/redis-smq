import { MessagesService } from './messages.service';
import { TApplication } from '../types/common';
import { MessageManager } from '../../system/message-manager/message-manager';
import { QueuesService } from './queues.service';
import { QueueManager } from '../../system/queue-manager/queue-manager';

export function Services(app: TApplication) {
  const { redis, logger } = app.context;
  let messagesService: MessagesService | null = null;
  let queuesService: QueuesService | null = null;
  return {
    get messagesService() {
      if (!messagesService) {
        const messageManager = new MessageManager(redis, logger);
        messagesService = new MessagesService(messageManager);
      }
      return messagesService;
    },
    get queuesService() {
      if (!queuesService) {
        const queueManager = new QueueManager(redis, logger);
        queuesService = new QueuesService(queueManager);
      }
      return queuesService;
    },
  };
}
