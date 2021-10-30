import {
  ICallback,
  IConfig,
  TGetAcknowledgedMessagesReply,
  TGetScheduledMessagesReply,
} from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { MessageManager } from './message-manager';
import { Message } from '../message';

export class MessageManagerFrontend {
  private static instance: MessageManagerFrontend | null = null;
  private redisClient: RedisClient;
  private messageManager: MessageManager;

  private constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.messageManager = new MessageManager(redisClient);
  }

  ///

  scheduleMessage(message: Message, cb: ICallback<boolean>): void {
    this.messageManager.scheduleMessage(message, cb);
  }

  ///

  deleteScheduledMessage(
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteScheduledMessage(index, messageId, cb);
  }

  deleteDeadLetterMessage(
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteDeadLetterMessage(
      queueName,
      index,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteAcknowledgedMessage(
      queueName,
      index,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessage(queueName, index, messageId, cb);
  }

  deletePendingMessageWithPriority(
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessageWithPriority(
      queueName,
      index,
      messageId,
      cb,
    );
  }

  ///

  requeueMessageFromDLQueue(
    queueName: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromDLQueue(
      queueName,
      index,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queueName: string,
    index: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromAcknowledgedQueue(
      queueName,
      index,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  ///

  getAcknowledgedMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    this.messageManager.getAcknowledgedMessages(queueName, skip, take, cb);
  }

  getDeadLetterMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    this.messageManager.getDeadLetterMessages(queueName, skip, take, cb);
  }

  getPendingMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    this.messageManager.getPendingMessages(queueName, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    this.messageManager.getPendingMessagesWithPriority(
      queueName,
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
        else if (!client) cb(new Error(`Expected an instance of RedisClient`));
        else {
          const instance = new MessageManagerFrontend(client);
          MessageManagerFrontend.instance = instance;
          cb(null, instance);
        }
      });
    } else cb(null, MessageManagerFrontend.instance);
  }
}
