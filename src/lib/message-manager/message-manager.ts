import { errors, logger, RedisClient } from 'redis-smq-common';
import { ScheduledMessages } from './scheduled-messages';
import { AcknowledgedMessages } from './acknowledged-messages';
import { DeadLetteredMessages } from './dead-lettered-messages';
import { PendingMessages } from './pending-messages';
import { getConfiguration } from '../../config/configuration';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class MessageManager {
  private static messageManagerInstance: MessageManager | null = null;
  private readonly redisClient;
  public readonly acknowledgedMessages;
  public readonly deadLetteredMessages;
  public readonly pendingMessages;
  public readonly scheduledMessages;

  private constructor(redisClient: RedisClient, logger: ICompatibleLogger) {
    this.redisClient = redisClient;
    this.acknowledgedMessages = new AcknowledgedMessages(redisClient, logger);
    this.deadLetteredMessages = new DeadLetteredMessages(redisClient, logger);
    this.pendingMessages = new PendingMessages(redisClient, logger);
    this.scheduledMessages = new ScheduledMessages(redisClient, logger);
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
      const { redis } = getConfiguration();
      RedisClient.getNewInstance(redis, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new errors.EmptyCallbackReplyError());
        else {
          const { logger: loggerCfg } = getConfiguration();
          const nsLogger = logger.getNamespacedLogger(
            loggerCfg,
            'message-manager',
          );
          MessageManager.messageManagerInstance = new MessageManager(
            client,
            nsLogger,
          );
          cb(null, MessageManager.messageManagerInstance);
        }
      });
    } else cb(null, MessageManager.messageManagerInstance);
  }
}
