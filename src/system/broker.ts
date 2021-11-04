import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
} from '../../types';
import { Message } from './message';
import BLogger from 'bunyan';
import { Logger } from './common/logger';
import { PowerManager } from './common/power-manager';
import { MessageManager } from './message-manager/message-manager';
import { Consumer } from './consumer/consumer';
import { RedisClient } from './redis-client/redis-client';

export class Broker {
  protected config: IConfig;
  protected logger: BLogger;
  protected powerManager: PowerManager;
  protected messageManager: MessageManager;
  protected priorityQueue: boolean;

  constructor(config: IConfig, messageManager: MessageManager) {
    this.config = config;
    this.logger = Logger(`broker`, config.log);
    this.powerManager = new PowerManager();
    this.messageManager = messageManager;
    this.priorityQueue = config.priorityQueue === true;
  }

  scheduleMessage(msg: Message, cb: ICallback<boolean>): void {
    this.messageManager.scheduleMessage(msg, cb);
  }

  enqueueMessage(
    queueName: string,
    message: Message,
    cb: ICallback<void>,
  ): void {
    this.messageManager.enqueueMessage(
      queueName,
      message,
      this.priorityQueue,
      cb,
    );
  }

  dequeueMessage(
    consumer: Consumer,
    redisClient: RedisClient,
    cb: ICallback<string>,
  ): void {
    const { keyQueue, keyQueuePriority, keyQueueProcessing } =
      consumer.getRedisKeys();
    if (this.priorityQueue) {
      this.messageManager.dequeueMessageWithPriority(
        redisClient,
        keyQueuePriority,
        keyQueueProcessing,
        cb,
      );
    } else {
      this.messageManager.dequeueMessage(
        redisClient,
        keyQueue,
        keyQueueProcessing,
        cb,
      );
    }
  }

  acknowledgeMessage(
    queueName: string,
    processingQueue: string,
    msg: Message,
    cb: ICallback<void>,
  ): void {
    this.messageManager.acknowledgeMessage(msg, queueName, processingQueue, cb);
  }

  unacknowledgeMessage(
    queueName: string,
    processingQueue: string,
    message: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    error: Error | undefined,
    cb: ICallback<void>,
  ): void {
    if (error) this.logger.error(error);
    this.logger.debug(`Unacknowledging message [${message.getId()}]...`);
    this.retry(queueName, processingQueue, message, unacknowledgedCause, cb);
  }

  /**
   * Move the message to dead-letter queue when max attempts threshold is reached or otherwise re-queue it again if
   * configured to do so. Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such
   * messages are periodically scheduled for delivery.
   */
  retry(
    queueName: string,
    processingQueue: string,
    message: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    if (
      unacknowledgedCause === EMessageUnacknowledgedCause.TTL_EXPIRED ||
      message.hasExpired()
    ) {
      //consumer.emit(events.MESSAGE_EXPIRED, message);
      this.logger.debug(
        `Message ID [${message.getId()}] has expired. Moving it to DLQ...`,
      );
      this.messageManager.deadLetterUnacknowledgedMessage(
        message,
        queueName,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.TTL_EXPIRED,
        (err) => cb(err),
      );
    } else if (message.isPeriodic()) {
      this.logger.debug(
        `Message ID [${message.getId()}] is periodic. Moving it to DLQ...`,
      );
      this.messageManager.deadLetterUnacknowledgedMessage(
        message,
        queueName,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.PERIODIC_MESSAGE,
        (err) => cb(err),
      );
    } else if (!message.hasRetryThresholdExceeded()) {
      this.logger.debug(
        `Message ID [${message.getId()}] is valid (threshold not exceeded) for re-queuing...`,
      );
      const delay = message.getRetryDelay();
      if (delay) {
        this.logger.debug(
          `Delaying message ID [${message.getId()}] before re-queuing...`,
        );
        this.messageManager.delayUnacknowledgedMessageBeforeRequeuing(
          message,
          queueName,
          processingQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      } else {
        this.logger.debug(
          `Re-queuing message ID [${message.getId()}] for one more time...`,
        );
        this.messageManager.requeueUnacknowledgedMessage(
          message,
          queueName,
          processingQueue,
          this.priorityQueue,
          unacknowledgedCause,
          (err) => cb(err),
        );
      }
    } else {
      this.logger.debug(
        `Message ID [${message.getId()}] retry threshold exceeded. Moving message to DLQ...`,
      );
      this.messageManager.deadLetterUnacknowledgedMessage(
        message,
        queueName,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
        (err) => cb(err),
      );
    }
  }

  quit(cb: ICallback<void>): void {
    this.messageManager.quit(cb);
  }
}
