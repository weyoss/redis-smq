import { promisifyAll } from 'bluebird';
import { MessageManager } from '../../src/lib/message-manager/message-manager';
import { IConfig } from '../../types';
import { requiredConfig } from './config';

const MessageManagerAsync = promisifyAll(MessageManager);
let messageManager: MessageManager | null = null;

export async function getMessageManager(cfg: IConfig = requiredConfig) {
  if (!messageManager) {
    messageManager = await MessageManagerAsync.createInstanceAsync(cfg);
  }
  return {
    deadLetteredMessages: promisifyAll(messageManager.deadLetteredMessages),
    acknowledgedMessages: promisifyAll(messageManager.acknowledgedMessages),
    pendingMessages: promisifyAll(messageManager.pendingMessages),
    scheduledMessages: promisifyAll(messageManager.scheduledMessages),
  };
}

export async function shutDownMessageManager() {
  if (messageManager) {
    await promisifyAll(messageManager).quitAsync();
    messageManager = null;
  }
}
