import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TQueueParams,
} from '../../../types';
import { Message } from '../message';
import BLogger from 'bunyan';
import { PowerManager } from './power-manager/power-manager';
import { MessageManager } from '../message-manager/message-manager';
import { Consumer } from '../consumer/consumer';
import { RedisClient } from './redis-client/redis-client';
import { QueueManager } from '../queue-manager/queue-manager';
import { ArgumentError } from './errors/argument.error';

export class Broker {
  protected logger: BLogger;
  protected powerManager: PowerManager;
  protected messageManager: MessageManager;
  protected queueManager: QueueManager;

  constructor(
    messageManager: MessageManager,
    queueManager: QueueManager,
    logger: BLogger,
  ) {
    this.messageManager = messageManager;
    this.queueManager = queueManager;
    this.logger = logger.child({ child: Broker.name });
    this.powerManager = new PowerManager();
  }

  setUpMessageQueue(queue: TQueueParams, cb: ICallback<void>): void {
    this.queueManager.setUpMessageQueue(queue, cb);
  }

  scheduleMessage(msg: Message, cb: ICallback<boolean>): void {
    const queue = msg.getQueue();
    if (!queue) {
      cb(new ArgumentError("Can't schedule a message without a message queue"));
    } else {
      this.messageManager.xScheduleMessage(msg, cb);
    }
  }

  enqueueMessage(message: Message, cb: ICallback<void>): void {
    this.messageManager.enqueueMessage(message, cb);
  }

  dequeueMessage(
    consumer: Consumer,
    redisClient: RedisClient,
    cb: ICallback<string>,
  ): void {
    const queue = consumer.getQueue();
    const { keyQueueProcessing } = consumer.getRedisKeys();
    if (consumer.isUsingPriorityQueuing()) {
      this.messageManager.dequeueMessageWithPriority(
        redisClient,
        queue,
        keyQueueProcessing,
        cb,
      );
    } else {
      this.messageManager.dequeueMessage(
        redisClient,
        queue,
        keyQueueProcessing,
        cb,
      );
    }
  }

  acknowledgeMessage(
    processingQueue: string,
    msg: Message,
    cb: ICallback<void>,
  ): void {
    this.messageManager.acknowledgeMessage(msg, processingQueue, cb);
  }

  unacknowledgeMessage(
    processingQueue: string,
    message: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    error: Error | undefined,
    cb: ICallback<EMessageDeadLetterCause>,
  ): void {
    if (error) this.logger.debug(error);
    this.logger.debug(
      `Determining if message (ID ${message.getId()}) can be re-queued...`,
    );
    this.retry(processingQueue, message, unacknowledgedCause, cb);
  }

  deadLetterMessage(
    message: Message,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    deadLetterCause: EMessageDeadLetterCause,
    cb: ICallback<EMessageDeadLetterCause>,
  ): void {
    this.messageManager.deadLetterUnacknowledgedMessage(
      message,
      keyQueueProcessing,
      unacknowledgedCause,
      EMessageDeadLetterCause.TTL_EXPIRED,
      (err) => {
        if (err) cb(err);
        else cb(null, deadLetterCause);
      },
    );
  }

  retry(
    processingQueue: string,
    message: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<EMessageDeadLetterCause>,
  ): void {
    if (
      unacknowledgedCause === EMessageUnacknowledgedCause.TTL_EXPIRED ||
      message.hasExpired()
    ) {
      //consumer.emit(events.MESSAGE_EXPIRED, message);
      this.logger.debug(
        `Message (ID ${message.getId()}) has expired. Moving it to dead-letter queue...`,
      );
      this.deadLetterMessage(
        message,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.TTL_EXPIRED,
        cb,
      );
    } else if (message.isPeriodic()) {
      // Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such
      // messages are periodically scheduled for delivery.
      this.logger.debug(
        `Message (ID ${message.getId()}) is periodic. Moving it to dead-letter queue...`,
      );
      this.deadLetterMessage(
        message,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.PERIODIC_MESSAGE,
        cb,
      );
    } else if (!message.hasRetryThresholdExceeded()) {
      this.logger.debug(
        `Retry threshold for message (ID ${message.getId()}) has not yet been exceeded. Checking message retryDelay...`,
      );
      const delay = message.getRetryDelay();
      if (delay) {
        this.logger.debug(
          `Message (ID ${message.getId()}) has a retryDelay. Delaying...`,
        );
        this.messageManager.delayUnacknowledgedMessageBeforeRequeuing(
          message,
          processingQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      } else {
        this.logger.debug(`Re-queuing message (ID [${message.getId()})...`);
        this.messageManager.requeueUnacknowledgedMessage(
          message,
          processingQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      }
    } else {
      this.logger.debug(
        `Retry threshold for message (ID ${message.getId()}) has exceeded. Moving message to dead-letter queue...`,
      );
      this.deadLetterMessage(
        message,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
        cb,
      );
    }
  }

  quit(cb: ICallback<void>): void {
    this.messageManager.quit(cb);
  }
}
