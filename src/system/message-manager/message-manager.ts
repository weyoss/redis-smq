import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TGetScheduledMessagesReply,
  TQueueParams,
} from '../../../types';
import { RedisClient } from '../common/redis-client/redis-client';
import { Message } from '../message';
import { EnqueueHandler } from './handlers/enqueue.handler';
import { DequeueHandler } from './handlers/dequeue.handler';
import { ScheduleHandler } from './handlers/schedule.handler';
import { ProcessingHandler } from './handlers/processing.handler';
import { DelayHandler } from './handlers/delay.handler';
import { RequeueHandler } from './handlers/requeue.handler';
import BLogger from 'bunyan';

export class MessageManager {
  protected redisClient: RedisClient;
  protected enqueueHandler: EnqueueHandler;
  protected processingHandler: ProcessingHandler;
  protected scheduleHandler: ScheduleHandler;
  protected delayHandler: DelayHandler;
  protected requeueHandler: RequeueHandler;
  protected logger: BLogger;

  // DequeueHandler needs an exclusive redis client and it is initialized only on-demand
  protected dequeueHandler: DequeueHandler | null = null;

  constructor(redisClient: RedisClient, logger: BLogger) {
    this.redisClient = redisClient;
    this.enqueueHandler = new EnqueueHandler(redisClient);
    this.processingHandler = new ProcessingHandler(redisClient);
    this.requeueHandler = new RequeueHandler(redisClient, this.enqueueHandler);
    this.scheduleHandler = new ScheduleHandler(redisClient);
    this.delayHandler = new DelayHandler(redisClient, this.scheduleHandler);
    this.logger = logger.child({ child: MessageManager.name });
  }

  ///

  protected getDequeueHandler(
    redisClient: RedisClient,
    queue: TQueueParams,
    keyQueueProcessing: string,
  ): DequeueHandler {
    if (!this.dequeueHandler) {
      this.dequeueHandler = new DequeueHandler(
        redisClient,
        queue,
        keyQueueProcessing,
      );
    }
    return this.dequeueHandler;
  }

  ///

  // requires an exclusive redis client
  dequeueMessage(
    redisClient: RedisClient,
    queue: TQueueParams,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    this.logger.debug(`De-queuing...`);
    this.getDequeueHandler(redisClient, queue, keyQueueProcessing).dequeue(cb);
  }

  // requires an exclusive redis client
  dequeueMessageWithPriority(
    redisClient: RedisClient,
    queue: TQueueParams,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    this.logger.debug(`De-queuing with priority...`);
    this.getDequeueHandler(
      redisClient,
      queue,
      keyQueueProcessing,
    ).dequeueWithPriority(cb);
  }

  ///

  enqueueMessage(message: Message, cb: ICallback<void>): void {
    this.logger.debug(`Enqueuing message (ID ${message.getId()})...`);
    this.enqueueHandler.enqueue(this.redisClient, message, cb);
  }

  ///

  enqueueScheduledMessages(cb: ICallback<void>): void {
    this.logger.debug(`Enqueuing scheduled messages ...`);
    this.scheduleHandler.enqueueScheduledMessages(cb);
  }

  xScheduleMessage(message: Message, cb: ICallback<boolean>): void {
    this.logger.debug(`Scheduling message (ID ${message.getId()})...`);
    this.scheduleHandler.xSchedule(message, cb);
  }

  ///

  requeueUnacknowledgedMessage(
    message: Message,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Moving unacknowledged message (ID ${message.getId()}) to "re-queue" queue...`,
    );
    this.processingHandler.requeue(
      message,
      keyQueueProcessing,
      unacknowledgedCause,
      cb,
    );
  }

  scheduleDelayedMessages(cb: ICallback<void>): void {
    this.logger.debug(
      `Scheduling unacknowledged messages from the delay queue...`,
    );
    this.delayHandler.schedule(cb);
  }

  delayUnacknowledgedMessageBeforeRequeuing(
    message: Message,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Moving unacknowledged message (ID ${message.getId()}) to "delay" queue...`,
    );
    this.processingHandler.delayUnacknowledgedMessageBeforeRequeuing(
      message,
      keyQueueProcessing,
      unacknowledgedCause,
      cb,
    );
  }

  acknowledgeMessage(
    message: Message,
    keyQueueProcessing: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Moving message (ID ${message.getId()}) to "acknowledged" queue...`,
    );
    this.processingHandler.acknowledge(message, keyQueueProcessing, cb);
  }

  deadLetterUnacknowledgedMessage(
    message: Message,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    deadLetterCause: EMessageDeadLetterCause,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Moving unacknowledged message (ID ${message.getId()}) to dead-letter queue (unacknowledgedCause: ${unacknowledgedCause}, deadLetterCause: ${deadLetterCause})...`,
    );
    this.processingHandler.deadLetterMessage(
      message,
      keyQueueProcessing,
      unacknowledgedCause,
      deadLetterCause,
      cb,
    );
  }

  deleteScheduledMessage(messageId: string, cb: ICallback<void>): void {
    this.logger.debug(`Deleting scheduled message ID ${messageId}}...`);
    this.scheduleHandler.deleteScheduled(messageId, cb);
  }

  deleteDeadLetteredMessage(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting dead-lettered message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queue.name}, ns ${queue.ns})...`,
    );
    this.processingHandler.deleteDeadLetteredMessage(
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
    this.logger.debug(
      `Deleting acknowledged message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queue.name}, ns ${queue.ns})...`,
    );
    this.processingHandler.deleteAcknowledgedMessage(
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
    this.logger.debug(
      `Deleting pending message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queue.name}, ns ${queue.ns})...`,
    );
    this.enqueueHandler.deletePendingMessage(queue, sequenceId, messageId, cb);
  }

  deletePendingMessageWithPriority(
    queue: TQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting pending message with priority (ID ${messageId}, queueName ${queue.name}, ns ${queue.ns})...`,
    );
    this.enqueueHandler.deletePendingMessageWithPriority(queue, messageId, cb);
  }

  ///

  requeueMessageFromDLQueue(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Re-queuing dead-lettered message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${
        queue.name
      }, ns ${queue.ns}, priority ${priority ?? 'without priority'})...`,
    );
    this.requeueHandler.requeueMessageFromDLQueue(
      queue,
      sequenceId,
      messageId,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Re-queuing acknowledged message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${
        queue.name
      }, ns ${queue.ns}, priority ${priority ?? 'without priority'})...`,
    );
    this.requeueHandler.requeueMessageFromAcknowledgedQueue(
      queue,
      sequenceId,
      messageId,
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
    this.enqueueHandler.getAcknowledgedMessages(queue, skip, take, cb);
  }

  getDeadLetteredMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getDeadLetteredMessages(queue, skip, take, cb);
  }

  getPendingMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getPendingMessages(queue, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    this.enqueueHandler.getPendingMessagesWithPriority(queue, skip, take, cb);
  }

  getScheduledMessages(
    skip: number,
    take: number,
    cb: ICallback<TGetScheduledMessagesReply>,
  ): void {
    this.scheduleHandler.getScheduledMessages(skip, take, cb);
  }

  getScheduledMessagesCount(cb: ICallback<number>): void {
    this.scheduleHandler.getScheduledMessagesCount(cb);
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
