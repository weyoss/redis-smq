import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
  IMessageMetadata,
  TGetAcknowledgedMessagesReply,
  TGetScheduledMessagesReply,
} from '../types';
import { RedisClient } from './system/redis-client/redis-client';
import { Message } from './message';
import { redisKeys } from './system/redis-keys';
import { EnqueueMessageHandler } from './system/message-manager/handlers/enqueue-message-handler';
import { DequeueMessageHandler } from './system/message-manager/handlers/dequeue-message-handler';
import { ScheduledMessagesHandler } from './system/message-manager/handlers/scheduled-messages-handler';
import { ProcessingQueueMessageHandler } from './system/message-manager/handlers/processing-queue-message-handler';
import { Scheduler } from './system/scheduler';

export class MessageManager {
  protected static instance: MessageManager | null = null;
  protected redisClient: RedisClient;
  protected enqueueMessageHandler: EnqueueMessageHandler;
  protected dequeueMessageHandler: DequeueMessageHandler;
  protected processingQueueMessageHandler: ProcessingQueueMessageHandler;
  protected scheduledMessageHandler: ScheduledMessagesHandler;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.enqueueMessageHandler = new EnqueueMessageHandler();
    this.dequeueMessageHandler = new DequeueMessageHandler();
    this.scheduledMessageHandler = new ScheduledMessagesHandler();
    this.processingQueueMessageHandler = new ProcessingQueueMessageHandler();
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

  enqueueScheduledMessages(
    scheduler: Scheduler,
    queueName: string,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    this.scheduledMessageHandler.enqueueScheduledMessages(
      this.redisClient,
      scheduler,
      queueName,
      withPriority,
      cb,
    );
  }

  scheduleMessage(
    queueName: string,
    message: Message,
    timestamp: number,
    cb: ICallback<void>,
  ): void {
    this.scheduledMessageHandler.schedule(
      this.redisClient,
      queueName,
      message,
      timestamp,
      cb,
    );
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

  delayUnacknowledgedMessageBeforeRequeuing(
    message: Message,
    queueName: string,
    delayTimestamp: number,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.processingQueueMessageHandler.delayBeforeRequeue(
      this.redisClient,
      message,
      queueName,
      delayTimestamp,
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

  ///
  /*
  deletePendingMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageOperation.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [EMessageMetadata.ENQUEUED, EMessageMetadata.ENQUEUED_WITH_PRIORITY],
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageOperation.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [EMessageMetadata.ACKNOWLEDGED],
      cb,
    );
  }

  deleteScheduledMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageOperation.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [EMessageMetadata.SCHEDULED],
      cb,
    );
  }

  deleteDeadLetterMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageOperation.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [EMessageMetadata.DEAD_LETTER],
      cb,
    );
  }
   */

  ///

  /*
  requeueMessageFromAcknowledgedQueue(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.requeueMessageOperation.requeue(
      this.redisClient,
      queueName,
      messageId,
      false,
      undefined,
      [EMessageMetadata.ACKNOWLEDGED],
      cb,
    );
  }

  requeueMessageWithPriorityFromAcknowledgedQueue(
    queueName: string,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.requeueMessageOperation.requeue(
      this.redisClient,
      queueName,
      messageId,
      true,
      priority,
      [EMessageMetadata.ACKNOWLEDGED],
      cb,
    );
  }

  requeueMessageFromDLQueue(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.requeueMessageOperation.requeue(
      this.redisClient,
      queueName,
      messageId,
      false,
      undefined,
      [EMessageMetadata.DEAD_LETTER],
      cb,
    );
  }

  requeueMessageWithPriorityFromDLQueue(
    queueName: string,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.requeueMessageOperation.requeue(
      this.redisClient,
      queueName,
      messageId,
      true,
      priority,
      [EMessageMetadata.DEAD_LETTER],
      cb,
    );
  }
  */
  ///

  getAcknowledgedMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(
        redisClient,
        queueName,
        'acknowledged',
        cb,
      );
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueueAcknowledgedMessages,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getDeadLetterMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(redisClient, queueName, 'deadLetter', cb);
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueueDL,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getPendingMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(redisClient, queueName, 'pending', cb);
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueue } = redisKeys.getKeys(queueName);
    this.redisClient.lRangePage(
      keyQueue,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getPendingMessagesWithPriority(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(
        redisClient,
        queueName,
        'pendingWithPriority',
        cb,
      );
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueuePriority } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueuePriority,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getScheduledMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetScheduledMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(redisClient, queueName, 'scheduled', cb);
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueueScheduledMessages } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueueScheduledMessages,
      skip,
      take,
      getTotalFn,
      transformFn,
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
