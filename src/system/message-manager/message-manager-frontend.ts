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
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteDeadLetterMessage(
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deleteAcknowledgedMessage(
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessage(
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessageWithPriority(
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.messageManager.deletePendingMessageWithPriority(
      queueName,
      sequenceId,
      messageId,
      cb,
    );
  }

  ///

  requeueMessageFromDLQueue(
    queueName: string,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromDLQueue(
      queueName,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queueName: string,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.messageManager.requeueMessageFromAcknowledgedQueue(
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
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getAcknowledgedMessages(queueName, skip, take, cb);
  }

  getDeadLetterMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getDeadLetteredMessages(queueName, skip, take, cb);
  }

  getPendingMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.messageManager.getPendingMessages(queueName, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
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
