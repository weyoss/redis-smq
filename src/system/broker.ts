import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
  TRedisClientMulti,
} from '../../types';
import { Message } from '../message';
import { events } from './events';
import { Scheduler } from './scheduler';
import BLogger from 'bunyan';
import { Logger } from './logger';
import { PowerManager } from './power-manager';
import { QueueManager } from './queue-manager';
import { RedisClient } from './redis-client';
import { MessageManager } from '../message-manager';
import { metadata } from './metadata';
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
    mixed: TRedisClientMulti | RedisClient,
    cb?: ICallback<void>,
  ): void {
    const process = (multi: TRedisClientMulti) => {
      if (this.config.priorityQueue === true)
        this.messageManager.enqueueMessageWithPriority(
          queueName,
          message,
          multi,
        );
      else this.messageManager.enqueueMessage(queueName, message, multi);
    };
    if (mixed instanceof RedisClient) {
      if (typeof cb !== 'function') {
        throw new Error('Wrong argument types. Expected a callback function');
      }
      const multi = mixed.multi();
      process(multi);
      mixed.execMulti(multi, (err) => cb(err));
    } else process(mixed);
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
    client: RedisClient,
    consumer: Consumer,
    msg: Message,
    cb: ICallback<void>,
  ): void {
    const queueName = consumer.getQueueName();
    const { keyQueueProcessing } = consumer.getRedisKeys();
    const multi = client.multi();
    this.messageManager.moveMessageToAcknowledgmentQueue(queueName, msg, multi);
    this.queueManager.purgeProcessingQueue(keyQueueProcessing, multi);
    client.execMulti(multi, (err) => cb(err));
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
    consumer.applyOptions(message);
    const multi = client.multi();
    const queueName = consumer.getQueueName();
    metadata.preMessageUnacknowledged(
      message,
      queueName,
      unacknowledgedCause,
      multi,
    );
    this.queueManager.purgeProcessingQueue(processingQueue, multi);
    let scheduled = false;
    let requeued = false;
    let deadLetter = false;
    if (
      unacknowledgedCause === EMessageUnacknowledgedCause.TTL_EXPIRED ||
      message.hasExpired()
    ) {
      consumer.emit(events.MESSAGE_EXPIRED, message);
      this.logger.debug(
        `Message ID [${message.getId()}] has expired. Moving it to DLQ...`,
      );
      this.messageManager.moveMessageToDLQQueue(
        queueName,
        message,
        EMessageDeadLetterCause.TTL_EXPIRED,
        multi,
      );
      deadLetter = true;
    } else if (this.schedulerInstance.isPeriodic(message)) {
      this.logger.debug(
        `Message ID [${message.getId()}] is periodic. Moving it to DLQ...`,
      );
      this.messageManager.moveMessageToDLQQueue(
        queueName,
        message,
        EMessageDeadLetterCause.PERIODIC_MESSAGE,
        multi,
      );
      deadLetter = true;
    } else {
      if (!message.hasRetryThresholdExceeded()) {
        message.incrAttempts();
        this.logger.debug(
          `Message ID [${message.getId()}] is valid (threshold not exceeded) for re-queuing...`,
        );
        const delay = message.getRetryDelay();
        if (delay) {
          this.logger.debug(
            `Delaying message ID [${message.getId()}] before re-queuing...`,
          );
          message.setScheduledDelay(delay);
          this.schedulerInstance.schedule(message, multi);
          scheduled = true;
        } else {
          this.logger.debug(
            `Re-queuing message ID [${message.getId()}] for one more time...`,
          );
          this.enqueueMessage(queueName, message, multi);
          requeued = true;
        }
      } else {
        this.logger.debug(
          `Message ID [${message.getId()}] retry threshold exceeded. Moving message to DLQ...`,
        );
        this.messageManager.moveMessageToDLQQueue(
          queueName,
          message,
          EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
          multi,
        );
        deadLetter = true;
      }
    }
    client.execMulti(multi, (err) => {
      if (err) cb(err);
      else {
        if (requeued) {
          consumer.emit(events.MESSAGE_RETRY, message);
        } else if (scheduled) {
          consumer.emit(events.MESSAGE_RETRY_AFTER_DELAY, message);
        } else if (deadLetter) {
          consumer.emit(events.MESSAGE_DEAD_LETTER, message);
        }
        cb();
      }
    });
  }
}
