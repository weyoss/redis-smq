import { ICallback } from '../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { ScheduledMessages } from './scheduled-messages';
import { AcknowledgedMessages } from './acknowledged-messages';
import { DeadLetteredMessages } from './dead-lettered-messages';
import { PendingMessages } from './pending-messages';

export class MessageManager {
  private static messageManagerInstance: MessageManager | null = null;
  private readonly redisClient;
  public readonly acknowledgedMessages;
  public readonly deadLetteredMessages;
  public readonly pendingMessages;
  public readonly scheduledMessages;

  private constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.acknowledgedMessages = new AcknowledgedMessages(redisClient);
    this.deadLetteredMessages = new DeadLetteredMessages(redisClient);
    this.pendingMessages = new PendingMessages(redisClient);
    this.scheduledMessages = new ScheduledMessages(redisClient);
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt((err) => {
      if (err) cb(err);
      else {
        MessageManager.messageManagerInstance = null;
        cb();
      }
    });
  }

  static getSingletonInstance(cb: ICallback<MessageManager>): void {
    if (!MessageManager.messageManagerInstance) {
      RedisClient.getNewInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new EmptyCallbackReplyError());
        else {
          MessageManager.messageManagerInstance = new MessageManager(client);
          cb(null, MessageManager.messageManagerInstance);
        }
      });
    } else cb(null, MessageManager.messageManagerInstance);
  }
}
