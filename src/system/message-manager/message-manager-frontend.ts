import {
  ICallback,
  IConfig,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TGetScheduledMessagesReply,
} from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { MessageManager } from './message-manager';
import BLogger from 'bunyan';
import { Logger } from '../common/logger';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';

export class MessageManagerFrontend {
  private static instance: MessageManagerFrontend | null = null;
  private redisClient: RedisClient;
  private messageManager: MessageManager;

  private constructor(redisClient: RedisClient, logger: BLogger) {
    this.redisClient = redisClient;
    this.messageManager = new MessageManager(redisClient, logger);
  }

  ///

  deleteScheduledMessage(messageId: string, cb: ICallback<void>): void {
    this.messageManager.deleteScheduledMessage(messageId, cb);
  }

  deleteDeadLetterMessage(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteDeadLetterMessage(
      queueName,
      ns,
      sequenceId,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteAcknowledgedMessage(
      queueName,
      ns,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessage(
      queueName,
      ns,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessageWithPriority(
    queueName: string,
    ns: string | undefined,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessageWithPriority(
      queueName,
      ns,
      messageId,
      cb,
    );
  }

  ///

  requeueMessageFromDLQueue(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromDLQueue(
      queueName,
      ns,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromAcknowledgedQueue(
      queueName,
      ns,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  ///

  getAcknowledgedMessages(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getAcknowledgedMessages(queueName, ns, skip, take, cb);
  }

  getDeadLetterMessages(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getDeadLetteredMessages(queueName, ns, skip, take, cb);
  }

  getPendingMessages(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getPendingMessages(queueName, ns, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    this.messageManager.getPendingMessagesWithPriority(
      queueName,
      ns,
      skip,
      take,
      cb,
    );
  }

  getScheduledMessages(
    skip: number,
    take: number,
    cb: ICallback<TGetScheduledMessagesReply>,
  ): void {
    this.messageManager.getScheduledMessages(skip, take, cb);
  }

  ///

  quit(cb: ICallback<void>): void {
    this.messageManager.quit(() => {
      this.redisClient.halt(() => {
        MessageManagerFrontend.instance = null;
        cb();
      });
    });
  }

  ///

  static getSingletonInstance(
    config: IConfig,
    cb: ICallback<MessageManagerFrontend>,
  ): void {
    if (!MessageManagerFrontend.instance) {
      RedisClient.getNewInstance(config, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new EmptyCallbackReplyError());
        else {
          const logger = Logger(`${MessageManagerFrontend.name}`, config.log);
          const instance = new MessageManagerFrontend(client, logger);
          MessageManagerFrontend.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, MessageManagerFrontend.instance);
  }
}
