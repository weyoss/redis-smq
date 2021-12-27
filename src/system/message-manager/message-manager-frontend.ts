import {
  ICallback,
  IConfig,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TGetScheduledMessagesReply,
  TQueueParams,
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
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteDeadLetterMessage(
      queue,
      sequenceId,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteAcknowledgedMessage(
      queue,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessage(queue, sequenceId, messageId, cb);
  }

  deletePendingMessageWithPriority(
    queue: TQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessageWithPriority(queue, messageId, cb);
  }

  ///

  requeueMessageFromDLQueue(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromDLQueue(
      queue,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromAcknowledgedQueue(
      queue,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  ///

  getAcknowledgedMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getAcknowledgedMessages(queue, skip, take, cb);
  }

  getDeadLetterMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getDeadLetteredMessages(queue, skip, take, cb);
  }

  getPendingMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getPendingMessages(queue, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    this.messageManager.getPendingMessagesWithPriority(queue, skip, take, cb);
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
