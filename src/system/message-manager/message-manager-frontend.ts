import { ICallback, IConfig, TGetMessagesReply } from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { MessageManager } from './message-manager';

export class MessageManagerFrontend {
  private static instance: MessageManagerFrontend | null = null;
  private redisClient: RedisClient;
  private messageManager: MessageManager;

  private constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.messageManager = new MessageManager(redisClient);
  }

  ///

  deleteScheduledMessage(
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteScheduledMessage(sequenceId, messageId, cb);
  }

  deleteDeadLetterMessage(
    ns: string,
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteDeadLetterMessage(
      ns,
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    ns: string,
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteAcknowledgedMessage(
      ns,
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    ns: string,
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessage(
      ns,
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessageWithPriority(
    ns: string,
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessageWithPriority(
      ns,
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  ///

  requeueMessageFromDLQueue(
    ns: string,
    queueName: string,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromDLQueue(
      ns,
      queueName,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    ns: string,
    queueName: string,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromAcknowledgedQueue(
      ns,
      queueName,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  ///

  getAcknowledgedMessages(
    ns: string,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getAcknowledgedMessages(ns, queueName, skip, take, cb);
  }

  getDeadLetterMessages(
    ns: string,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getDeadLetteredMessages(ns, queueName, skip, take, cb);
  }

  getPendingMessages(
    ns: string,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getPendingMessages(ns, queueName, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    ns: string,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getPendingMessagesWithPriority(
      ns,
      queueName,
      skip,
      take,
      cb,
    );
  }

  getScheduledMessages(
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
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
