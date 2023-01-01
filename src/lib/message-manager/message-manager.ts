import {
  createClientInstance,
  errors,
  logger,
  RedisClient,
} from 'redis-smq-common';
import { ScheduledMessages } from './messages/scheduled-messages';
import { AcknowledgedMessages } from './messages/acknowledged-messages';
import { DeadLetteredMessages } from './messages/dead-lettered-messages';
import { PendingMessages } from './messages/pending-messages';
import { getConfiguration } from '../../config/configuration';
import { ICallback } from 'redis-smq-common/dist/types';
import { IConfig } from '../../../types';

export class MessageManager {
  private readonly redisClient;
  public readonly acknowledgedMessages;
  public readonly deadLetteredMessages;
  public readonly pendingMessages;
  public readonly scheduledMessages;

  private constructor(
    redisClient: RedisClient,
    acknowledgedMessages: AcknowledgedMessages,
    deadLetteredMessages: DeadLetteredMessages,
    pendingMessages: PendingMessages,
    scheduledMessages: ScheduledMessages,
  ) {
    this.redisClient = redisClient;
    this.acknowledgedMessages = acknowledgedMessages;
    this.deadLetteredMessages = deadLetteredMessages;
    this.pendingMessages = pendingMessages;
    this.scheduledMessages = scheduledMessages;
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(cb);
  }

  static createInstance(config: IConfig, cb: ICallback<MessageManager>): void {
    const cfg = getConfiguration(config);
    createClientInstance(cfg.redis, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const nsLogger = logger.getNamespacedLogger(
          cfg.logger,
          'message-manager',
        );
        const acknowledgedMessages = new AcknowledgedMessages(
          cfg,
          client,
          nsLogger,
        );
        const deadLetteredMessages = new DeadLetteredMessages(
          cfg,
          client,
          nsLogger,
        );
        const pendingMessages = new PendingMessages(cfg, client, nsLogger);
        const scheduledMessages = new ScheduledMessages(cfg, client, nsLogger);
        const messageManager = new MessageManager(
          client,
          acknowledgedMessages,
          deadLetteredMessages,
          pendingMessages,
          scheduledMessages,
        );
        cb(null, messageManager);
      }
    });
  }
}
