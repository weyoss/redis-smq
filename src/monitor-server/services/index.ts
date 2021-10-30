import { MessageManagerService } from './message-manager.service';
import { TApplication } from '../types/common';
import { MessageManager } from '../../system/message-manager/message-manager';

export function Services(app: TApplication) {
  const { redis } = app.context;
  let messageManagerServiceInstance: MessageManagerService | null = null;
  return {
    MessageManagerService() {
      if (!messageManagerServiceInstance) {
        const messageManager = new MessageManager(redis);
        messageManagerServiceInstance = new MessageManagerService(
          messageManager,
        );
      }
      return messageManagerServiceInstance;
    },
  };
}
