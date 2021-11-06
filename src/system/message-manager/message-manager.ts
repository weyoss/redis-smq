import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TGetMessagesReply,
} from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { Message } from '../message';
import { EnqueueHandler } from './handlers/enqueue.handler';
import { DequeueHandler } from './handlers/dequeue.handler';
import { ScheduleHandler } from './handlers/schedule.handler';
import { ProcessingHandler } from './handlers/processing.handler';
import { DelayHandler } from './handlers/delay.handler';
import { RequeueHandler } from './handlers/requeue.handler';

export class MessageManager {
  protected redisClient: RedisClient;
  protected enqueueHandler: EnqueueHandler;
  protected processingHandler: ProcessingHandler;
  protected scheduleHandler: ScheduleHandler;
  protected delayHandler: DelayHandler;
  protected requeueHandler: RequeueHandler;

  // DequeueHandler needs an exclusive redis client and it is initialized only on-demand
  protected dequeueHandler: DequeueHandler | null = null;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.enqueueHandler = new EnqueueHandler(redisClient);
    this.delayHandler = new DelayHandler(redisClient);
    this.requeueHandler = new RequeueHandler(redisClient);
    this.scheduleHandler = new ScheduleHandler(redisClient);
    this.processingHandler = new ProcessingHandler(redisClient);
  }

  ///

  protected getDequeueHandler(redisClient: RedisClient): DequeueHandler {
    if (!this.dequeueHandler) {
      this.dequeueHandler = new DequeueHandler(redisClient);
    }
    return this.dequeueHandler;
  }

  ///

  // requires an exclusive redis client
  dequeueMessage(
    redisClient: RedisClient,
    keyQueue: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    this.getDequeueHandler(redisClient).dequeue(
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
    this.getDequeueHandler(redisClient).dequeueWithPriority(
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
    this.enqueueHandler.enqueue(
      this.redisClient,
      queueName,
      message,
      withPriority,
      cb,
    );
  }

  ///

  enqueueScheduledMessages(withPriority: boolean, cb: ICallback<void>): void {
    this.scheduleHandler.enqueueScheduledMessages(
      this.redisClient,
      withPriority,
      cb,
    );
  }

  scheduleMessage(message: Message, cb: ICallback<boolean>): void {
    this.scheduleHandler.schedule(message, cb);
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
    this.processingHandler.requeue(
      message,
      queueName,
      keyQueueProcessing,
      withPriority,
      unacknowledgedCause,
      cb,
    );
  }

  scheduleDelayedMessages(cb: ICallback<void>): void {
    this.delayHandler.schedule(cb);
  }

  delayUnacknowledgedMessageBeforeRequeuing(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.processingHandler.delayBeforeRequeue(
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
    this.processingHandler.acknowledge(
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
    this.processingHandler.deadLetterMessage(
      message,
      queueName,
      keyQueueProcessing,
      unacknowledgedCause,
      deadLetterCause,
      cb,
    );
  }

  deleteScheduledMessage(
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.scheduleHandler.deleteScheduled(sequenceId, messageId, cb);
  }

  deleteDeadLetterMessage(
    ns: string,
    queueName: string,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.processingHandler.deleteDeadLetterMessage(
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
    this.processingHandler.deleteAcknowledgedMessage(
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
    this.enqueueHandler.deletePendingMessage(
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
    this.enqueueHandler.deletePendingMessageWithPriority(
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
    this.requeueHandler.requeueMessageFromDLQueue(
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
    this.requeueHandler.requeueMessageFromAcknowledgedQueue(
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
    this.enqueueHandler.getAcknowledgedMessages(ns, queueName, skip, take, cb);
  }

  getDeadLetteredMessages(
    ns: string,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getDeadLetteredMessages(ns, queueName, skip, take, cb);
  }

  getPendingMessages(
    ns: string,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getPendingMessages(ns, queueName, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    ns: string,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getPendingMessagesWithPriority(
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
    this.scheduleHandler.getScheduledMessages(skip, take, cb);
  }

  ///

  quit(cb: ICallback<void>): void {
    if (this.dequeueHandler) {
      this.dequeueHandler.quit(() => {
        this.dequeueHandler = null;
        cb();
      });
    } else cb();
  }
}
