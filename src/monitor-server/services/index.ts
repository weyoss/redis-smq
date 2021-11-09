import { MessageManagerService } from './message-manager.service';
import { TApplication } from '../types/common';
import { MessageManager } from '../../system/message-manager/message-manager';
import { QueueManagerService } from './queue-manager.service';
import { QueueManager } from '../../system/queue-manager/queue-manager';

export function Services(app: TApplication) {
  const { redis, logger } = app.context;
  let messageManagerServiceInstance: MessageManagerService | null = null;
  let queueManagerServiceInstance: QueueManagerService | null = null;
  return {
    get messageManagerService() {
      if (!messageManagerServiceInstance) {
        const messageManager = new MessageManager(redis, logger);
        messageManagerServiceInstance = new MessageManagerService(
          messageManager,
        );
      }
      return messageManagerServiceInstance;
    },
    get queueManagerService() {
      if (!queueManagerServiceInstance) {
        const queueManager = new QueueManager(redis, logger);
        queueManagerServiceInstance = new QueueManagerService(queueManager);
      }
      return queueManagerServiceInstance;
    },
  };
}
