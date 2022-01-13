import {
  ICallback,
  IConfig,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TGetScheduledMessagesReply,
  TQueueParams,
} from '../../../types';
import { RedisClient } from '../common/redis-client/redis-client';
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
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.deleteDeadLetterMessage(
      queueParams,
      sequenceId,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.deleteAcknowledgedMessage(
      queueParams,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.deletePendingMessage(
      queueParams,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessageWithPriority(
    queue: string | TQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.deletePendingMessageWithPriority(
      queueParams,
      messageId,
      cb,
    );
  }

  ///

  requeueMessageFromDLQueue(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.requeueMessageFromDLQueue(
      queueParams,
      sequenceId,
      messageId,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.requeueMessageFromAcknowledgedQueue(
      queueParams,
      sequenceId,
      messageId,
      priority,
      cb,
    );
  }

  ///

  getAcknowledgedMessages(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.getAcknowledgedMessages(queueParams, skip, take, cb);
  }

  getDeadLetterMessages(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.getDeadLetteredMessages(queueParams, skip, take, cb);
  }

  getPendingMessages(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.getPendingMessages(queueParams, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    const queueParams: TQueueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    this.messageManager.getPendingMessagesWithPriority(
      queueParams,
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
