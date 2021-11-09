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
    this.delayHandler = new DelayHandler(redisClient);
    this.requeueHandler = new RequeueHandler(redisClient);
    this.scheduleHandler = new ScheduleHandler(redisClient);
    this.processingHandler = new ProcessingHandler(redisClient);
    this.logger = logger.child({ child: MessageManager.name });
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
    this.logger.debug(`De-queuing...`);
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
    this.logger.debug(`De-queuing with priority...`);
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
    this.logger.debug(
      `Enqueuing message (ID ${message.getId()}), withPriority = ${withPriority})...`,
    );
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
    this.logger.debug(
      `Enqueuing scheduled messages (withPriority = ${withPriority})...`,
    );
    this.scheduleHandler.enqueueScheduledMessages(
      this.redisClient,
      withPriority,
      cb,
    );
  }

  scheduleMessage(message: Message, cb: ICallback<boolean>): void {
    this.logger.debug(`Scheduling message (ID ${message.getId()})...`);
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
    this.logger.debug(
      `Moving unacknowledged message (ID ${message.getId()}) to "re-queue" queue...`,
    );
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
    this.logger.debug(
      `Scheduling unacknowledged messages from the delay queue...`,
    );
    this.delayHandler.schedule(cb);
  }

  delayUnacknowledgedMessageBeforeRequeuing(
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Moving unacknowledged message (ID ${message.getId()}) to "delay" queue...`,
    );
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
    this.logger.debug(
      `Moving message (ID ${message.getId()}) to "acknowledged" queue...`,
    );
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
    this.logger.debug(
      `Moving unacknowledged message (ID ${message.getId()}) to dead-letter queue (unacknowledgedCause: ${unacknowledgedCause}, deadLetterCause: ${deadLetterCause})...`,
    );
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
    this.logger.debug(
      `Deleting scheduled message (ID ${messageId}, sequenceId ${sequenceId})...`,
    );
    this.scheduleHandler.deleteScheduled(sequenceId, messageId, cb);
  }

  deleteDeadLetterMessage(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting dead-lettered message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queueName}, ns ${
        ns ?? 'NA'
      })...`,
    );
    this.processingHandler.deleteDeadLetterMessage(
      queueName,
      ns,
      sequenceId,
      messageId,
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting acknowledged message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queueName}, ns ${
        ns ?? 'NA'
      })...`,
    );
    this.processingHandler.deleteAcknowledgedMessage(
      queueName,
      ns,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessage(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting pending message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queueName}, ns ${
        ns ?? 'NA'
      })...`,
    );
    this.enqueueHandler.deletePendingMessage(
      queueName,
      ns,
      sequenceId,
      messageId,
      cb,
    );
  }

  deletePendingMessageWithPriority(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting pending message with priority (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queueName}, ns ${
        ns ?? 'NA'
      })...`,
    );
    this.enqueueHandler.deletePendingMessageWithPriority(
      queueName,
      ns,
      sequenceId,
      messageId,
      cb,
    );
  }

  ///

  requeueMessageFromDLQueue(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Re-queuing dead-lettered message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queueName}, ns ${
        ns ?? 'NA'
      }, withPriority ${withPriority})...`,
    );
    this.requeueHandler.requeueMessageFromDLQueue(
      queueName,
      ns,
      sequenceId,
      messageId,
      withPriority,
      priority,
      cb,
    );
  }

  requeueMessageFromAcknowledgedQueue(
    queueName: string,
    ns: string | undefined,
    sequenceId: number,
    messageId: string,
    withPriority: boolean,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Re-queuing acknowledged message (ID ${messageId}, sequenceId ${sequenceId}, queueName ${queueName}, ns ${
        ns ?? 'NA'
      }, withPriority ${withPriority})...`,
    );
    this.requeueHandler.requeueMessageFromAcknowledgedQueue(
      queueName,
      ns,
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
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getAcknowledgedMessages(queueName, ns, skip, take, cb);
  }

  getDeadLetteredMessages(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getDeadLetteredMessages(queueName, ns, skip, take, cb);
  }

  getPendingMessages(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getPendingMessages(queueName, ns, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    this.enqueueHandler.getPendingMessagesWithPriority(
      queueName,
      ns,
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
