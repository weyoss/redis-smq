import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
  TGetAcknowledgedMessagesReply,
  TGetScheduledMessagesReply,
} from '../types';
import { RedisClient } from './system/redis-client/redis-client';
import { Message } from './message';
import { EnqueueMessageHandler } from './system/message-manager/handlers/enqueue-message.handler';
import { DequeueMessageHandler } from './system/message-manager/handlers/dequeue-message.handler';
import { ScheduledMessagesHandler } from './system/message-manager/handlers/scheduled-messages.handler';
import { ProcessingQueueMessageHandler } from './system/message-manager/handlers/processing-queue-message.handler';
import { DelayedMessagesHandler } from './system/message-manager/handlers/delayed-messages.handler';
import { RequeueMessageHandler } from './system/message-manager/handlers/requeue-message.handler';

export class MessageManager {
  protected static instance: MessageManager | null = null;
  protected redisClient: RedisClient;
  protected enqueueMessageHandler: EnqueueMessageHandler;
  protected dequeueMessageHandler: DequeueMessageHandler;
  protected processingQueueMessageHandler: ProcessingQueueMessageHandler;
  protected scheduledMessageHandler: ScheduledMessagesHandler;
  protected delayedMessagesHandler: DelayedMessagesHandler;
  protected requeueMessageHandler: RequeueMessageHandler;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.enqueueMessageHandler = new EnqueueMessageHandler();
    this.dequeueMessageHandler = new DequeueMessageHandler();
    this.scheduledMessageHandler = new ScheduledMessagesHandler();
    this.processingQueueMessageHandler = new ProcessingQueueMessageHandler();
    this.delayedMessagesHandler = new DelayedMessagesHandler();
    this.requeueMessageHandler = new RequeueMessageHandler();
  }

  ///

  // requires an exclusive redis client
  dequeueMessage(
    redisClient: RedisClient,
    keyQueue: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    this.dequeueMessageHandler.dequeue(
      redisClient,
      keyQueue,
      keyQueueProcessing,
      cb,
    );
  }

  // requires an exclusive redis client
  dequeueMessageWithPriority(
    redisClient: RedisClient,
    keyQueuePriority: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    this.dequeueMessageHandler.dequeueWithPriority(
      redisClient,
      keyQueuePriority,
      keyQueueProcessing,
      cb,
    );
  }

  ///

  enqueueMessage(
    queueName: string,
    message: Message,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    this.enqueueMessageHandler.enqueue(
      this.redisClient,
      queueName,
      message,
      withPriority,
      cb,
    );
  }

  ///

  enqueueScheduledMessages(withPriority: boolean, cb: ICallback<void>): void {
    this.scheduledMessageHandler.enqueueScheduledMessages(
      this.redisClient,
      withPriority,
      cb,
    );
  }

  scheduleMessage(message: Message, cb: ICallback<boolean>): void {
    this.scheduledMessageHandler.schedule(this.redisClient, message, cb);
  }

  ///

  requeueUnacknowledgedMessage(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    withPriority: boolean,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.processingQueueMessageHandler.requeue(
      this.redisClient,
      message,
      queueName,
      keyQueueProcessing,
      withPriority,
      unacknowledgedCause,
      cb,
    );
  }

  scheduleDelayedMessages(cb: ICallback<void>): void {
    this.delayedMessagesHandler.schedule(this.redisClient, cb);
  }

  delayUnacknowledgedMessageBeforeRequeuing(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.processingQueueMessageHandler.delayBeforeRequeue(
      this.redisClient,
      message,
      queueName,
      keyQueueProcessing,
      unacknowledgedCause,
      cb,
    );
  }

  acknowledgeMessage(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    cb: ICallback<void>,
  ): void {
    this.processingQueueMessageHandler.acknowledge(
      this.redisClient,
      message,
      queueName,
      keyQueueProcessing,
      cb,
    );
  }

  deadLetterUnacknowledgedMessage(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    deadLetterCause: EMessageDeadLetterCause,
    cb: ICallback<void>,
  ): void {
    this.processingQueueMessageHandler.deadLetterMessage(
      this.redisClient,
      message,
      queueName,
      keyQueueProcessing,
      unacknowledgedCause,
      deadLetterCause,
      cb,
    );
  }

  deleteScheduledMessage(
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.scheduledMessageHandler.deleteScheduled(
      this.redisClient,
      index,
      messageId,
      cb,
    );
  }

  deleteDeadLetterMessage(
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.processingQueueMessageHandler.deleteDeadLetterMessage(
      this.redisClient,
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
    this.processingQueueMessageHandler.deleteAcknowledgedMessage(
      this.redisClient,
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
    this.enqueueMessageHandler.deletePendingMessage(
      this.redisClient,
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
    this.requeueMessageHandler.requeueMessageFromDLQueue(
      this.redisClient,
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
    this.requeueMessageHandler.requeueMessageFromAcknowledgedQueue(
      this.redisClient,
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
    this.enqueueMessageHandler.getAcknowledgedMessages(
      this.redisClient,
      queueName,
      skip,
      take,
      cb,
    );
  }

  getDeadLetterMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    this.enqueueMessageHandler.getDeadLetterMessages(
      this.redisClient,
      queueName,
      skip,
      take,
      cb,
    );
  }

  getPendingMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    this.enqueueMessageHandler.getPendingMessages(
      this.redisClient,
      queueName,
      skip,
      take,
      cb,
    );
  }

  getPendingMessagesWithPriority(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    this.enqueueMessageHandler.getPendingMessagesWithPriority(
      this.redisClient,
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
    this.scheduledMessageHandler.getScheduledMessages(
      this.redisClient,
      skip,
      take,
      cb,
    );
  }

  ///

  quit(cb: ICallback<void>): void {
    this.dequeueMessageHandler.quit(() => {
      if (this === MessageManager.instance) {
        this.redisClient.halt(() => {
          MessageManager.instance = null;
          cb();
        });
      } else cb();
    });
  }

  ///

  static getSingletonInstance(
    config: IConfig,
    cb: ICallback<MessageManager>,
  ): void {
    if (!MessageManager.instance) {
      RedisClient.getNewInstance(config, (redisClient) => {
        const instance = new MessageManager(redisClient);
        MessageManager.instance = instance;
        cb(null, instance);
      });
    } else cb(null, MessageManager.instance);
  }
}
