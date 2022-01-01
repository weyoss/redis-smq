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
import { redisKeys } from '../common/redis-keys/redis-keys';

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
    namespace: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.messageManager.deleteDeadLetterMessage(
      queue,
      sequenceId,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    namespace: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.messageManager.deleteAcknowledgedMessage(
      queue,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    queueName: string,
    namespace: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.messageManager.deletePendingMessage(queue, sequenceId, messageId, cb);
  }

  deletePendingMessageWithPriority(
    queueName: string,
    namespace: string | undefined,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.messageManager.deletePendingMessageWithPriority(queue, messageId, cb);
  }

  ///

  requeueMessageFromDLQueue(
    queueName: string,
    namespace: string | undefined,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
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
    queueName: string,
    namespace: string | undefined,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
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
    queueName: string,
    namespace: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.messageManager.getAcknowledgedMessages(queue, skip, take, cb);
  }

  getDeadLetterMessages(
    queueName: string,
    namespace: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.messageManager.getDeadLetteredMessages(queue, skip, take, cb);
  }

  getPendingMessages(
    queueName: string,
    namespace: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
    this.messageManager.getPendingMessages(queue, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queueName: string,
    namespace: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: namespace ?? redisKeys.getNamespace(),
    };
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
