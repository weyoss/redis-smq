import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
} from '../../types';
import { Message } from '../message';
import { events } from './events';
import { Scheduler } from './scheduler';
import BLogger from 'bunyan';
import { Logger } from './logger';
import { PowerManager } from './power-manager';
import { QueueManager } from './queue-manager';
import { RedisClient } from './redis-client/redis-client';
import { MessageManager } from '../message-manager';
import { Consumer } from '../consumer';

export class Broker {
  protected config: IConfig;
  protected logger: BLogger;
  protected powerManager: PowerManager;
  protected schedulerInstance: Scheduler;
  protected messageManager: MessageManager;
  protected queueManager: QueueManager;

  constructor(
    config: IConfig,
    schedulerInstance: Scheduler,
    messageManager: MessageManager,
    queueManager: QueueManager,
  ) {
    this.config = config;
    this.logger = Logger(`broker`, config.log);
    this.powerManager = new PowerManager();
    this.schedulerInstance = schedulerInstance;
    this.messageManager = messageManager;
    this.queueManager = queueManager;
  }

  enqueueMessage(
    queueName: string,
    message: Message,
    cb: ICallback<void>,
  ): void {
    const withPriority = this.config.priorityQueue === true;
    if (withPriority) message.getSetPriority(undefined);
    this.messageManager.enqueueMessage(queueName, message, withPriority, cb);
  }

  dequeueMessage(
    redisClient: RedisClient,
    consumer: Consumer,
    cb: ICallback<string>,
  ): void {
    const { keyQueue, keyQueuePriority, keyQueueProcessing } =
      consumer.getRedisKeys();
    if (this.config.priorityQueue === true) {
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
    consumer: Consumer,
    msg: Message,
    cb: ICallback<void>,
  ): void {
    const queueName = consumer.getQueueName();
    const { keyQueueProcessing } = consumer.getRedisKeys();
    this.messageManager.acknowledgeMessage(
      msg,
      queueName,
      keyQueueProcessing,
      cb,
    );
  }

  unacknowledgeMessage(
    client: RedisClient,
    consumer: Consumer,
    message: Message,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    error?: Error,
  ): void {
    if (error) this.logger.error(error);
    this.logger.debug(`Unacknowledging message [${message.getId()}]...`);
    const { keyQueueProcessing } = consumer.getRedisKeys();
    this.retry(
      client,
      message,
      keyQueueProcessing,
      consumer,
      unacknowledgedCause,
      (err) => {
        if (err) consumer.emit(events.ERROR, err);
        else
          consumer.emit(
            events.MESSAGE_UNACKNOWLEDGED,
            message,
            unacknowledgedCause,
          );
      },
    );
  }

  /**
   * Move the message to dead-letter queue when max attempts threshold is reached or otherwise re-queue it again if
   * configured to do so. Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such
   * messages are periodically scheduled for delivery.
   */
  retry(
    client: RedisClient,
    message: Message,
    processingQueue: string,
    consumer: Consumer,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void | string>,
  ): void {
    const queueName = consumer.getQueueName();
    const withPriority = this.config.priorityQueue === true;
    if (withPriority) message.getSetPriority(undefined);
    if (
      unacknowledgedCause === EMessageUnacknowledgedCause.TTL_EXPIRED ||
      message.hasExpired()
    ) {
      consumer.emit(events.MESSAGE_EXPIRED, message);
      this.logger.debug(
        `Message ID [${message.getId()}] has expired. Moving it to DLQ...`,
      );
      this.messageManager.deadLetterUnacknowledgedMessage(
        message,
        queueName,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.TTL_EXPIRED,
        (err) => {
          if (err) cb(err);
          else {
            consumer.emit(events.MESSAGE_DEAD_LETTER, message);
            cb();
          }
        },
      );
    } else if (this.schedulerInstance.isPeriodic(message)) {
      this.logger.debug(
        `Message ID [${message.getId()}] is periodic. Moving it to DLQ...`,
      );
      this.messageManager.deadLetterUnacknowledgedMessage(
        message,
        queueName,
        processingQueue,
        unacknowledgedCause,
        EMessageDeadLetterCause.PERIODIC_MESSAGE,
        (err) => {
          if (err) cb(err);
          else {
            consumer.emit(events.MESSAGE_DEAD_LETTER, message);
            cb();
          }
        },
      );
    } else if (!message.hasRetryThresholdExceeded()) {
      this.logger.debug(
        `Message ID [${message.getId()}] is valid (threshold not exceeded) for re-queuing...`,
      );
      message.incrAttempts();
      const delay = message.getRetryDelay();
      if (delay) {
        this.logger.debug(
          `Delaying message ID [${message.getId()}] before re-queuing...`,
        );
        message.setScheduledDelay(delay);
        const delayTimestamp =
          this.schedulerInstance.getNextScheduledTimestamp(message);
        this.messageManager.delayUnacknowledgedMessageBeforeRequeuing(
          message,
          queueName,
          delayTimestamp,
          processingQueue,
          unacknowledgedCause,
          (err) => {
            if (err) cb(err);
            else {
              consumer.emit(events.MESSAGE_RETRY_AFTER_DELAY, message);
              cb();
            }
          },
        );
      } else {
        this.logger.debug(
          `Re-queuing message ID [${message.getId()}] for one more time...`,
        );
        this.messageManager.requeueUnacknowledgedMessage(
          message,
          queueName,
          processingQueue,
          withPriority,
          unacknowledgedCause,
          (err) => {
            if (err) cb(err);
            else {
              consumer.emit(events.MESSAGE_RETRY, message);
              cb();
            }
          },
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
        (err) => {
          if (err) cb(err);
          else {
            consumer.emit(events.MESSAGE_DEAD_LETTER, message);
            cb();
          }
        },
      );
    }
  }
}
