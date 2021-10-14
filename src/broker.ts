import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  IConfig,
  TConsumerOptions,
  TRedisClientMulti,
} from '../types';
import { Message } from './message';
import { Instance } from './instance';
import { events } from './events';
import { Scheduler } from './scheduler';
import BLogger from 'bunyan';
import { Logger } from './logger';
import { PowerManager } from './power-manager';
import { Metadata } from './metadata';
import { MessageManager } from './message-manager';
import { QueueManager } from './queue-manager';
import { RedisClient } from './redis-client';

export class Broker {
  protected instance: Instance;
  protected queueName: string;
  protected config: IConfig;
  protected logger: BLogger;
  protected powerManager: PowerManager;
  protected metadata: Metadata;
  protected schedulerInstance: Scheduler;
  protected messageManager: MessageManager;
  protected queueManager: QueueManager;

  constructor(
    instance: Instance,
    schedulerInstance: Scheduler,
    messageManager: MessageManager,
    queueManager: QueueManager,
  ) {
    this.instance = instance;
    this.queueName = instance.getQueueName();
    this.config = instance.getConfig();
    this.logger = Logger(
      `broker (${instance.getQueueName()}/${instance.getId()})`,
      instance.getConfig().log,
    );
    this.powerManager = new PowerManager();
    this.metadata = new Metadata(instance);
    this.schedulerInstance = schedulerInstance;
    this.messageManager = messageManager;
    this.queueManager = queueManager;
  }

  getInstance() {
    return this.instance;
  }

  handleMessageWithExpiredTTL(
    redisClient: RedisClient,
    message: Message,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    const multi = redisClient.multi();
    this.messageManager.moveMessageToDLQQueue(
      this,
      message,
      EMessageDeadLetterCause.TTL_EXPIRED,
      multi,
    );
    this.queueManager.cleanProcessingQueue(processingQueue, multi);
    redisClient.execMulti(multi, (err) => {
      if (err) cb(err);
      else {
        this.instance.emit(events.MESSAGE_DEAD_LETTER, message);
        cb();
      }
    });
  }

  moveMessageToDLQQueue(
    message: Message,
    cause: EMessageDeadLetterCause,
    multi: TRedisClientMulti,
  ): void {
    this.messageManager.moveMessageToDLQQueue(this, message, cause, multi);
  }

  moveMessageToAcknowledgmentQueue(
    message: Message,
    multi: TRedisClientMulti,
  ): void {
    this.messageManager.moveMessageToAcknowledgmentQueue(this, message, multi);
  }

  deleteProcessingQueue(
    queueName: string,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    this.queueManager.deleteProcessingQueue(this, processingQueueName, cb);
  }

  cleanProcessingQueue(
    processingQueueName: string,
    multi: TRedisClientMulti,
  ): void {
    this.queueManager.cleanProcessingQueue(processingQueueName, multi);
  }

  enqueueMessage(
    message: Message,
    mixed: TRedisClientMulti | RedisClient,
    cb?: ICallback<void>,
  ): void {
    const process = (multi: TRedisClientMulti) => {
      if (this.config.priorityQueue === true)
        this.messageManager.enqueueMessageWithPriority(this, message, multi);
      else this.messageManager.enqueueMessage(this, message, multi);
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
    consumerOptions: TConsumerOptions,
  ): void {
    if (this.config.priorityQueue === true) {
      this.messageManager.dequeueMessageWithPriority(
        this,
        redisClient,
        consumerOptions,
      );
    } else {
      this.messageManager.dequeueMessage(this, redisClient, consumerOptions);
    }
  }

  handleReceivedMessage(json: string, consumerOptions: TConsumerOptions): void {
    const message = Message.createFromMessage(json);
    this.applyConsumerOptions(message, consumerOptions);
    if (message.hasExpired())
      this.instance.emit(events.MESSAGE_EXPIRED, message);
    else this.instance.emit(events.MESSAGE_RECEIVED, message);
  }

  acknowledgeMessage(
    client: RedisClient,
    msg: Message,
    cb: ICallback<void>,
  ): void {
    const { keyQueueProcessing } = this.instance.getInstanceRedisKeys();
    const multi = client.multi();
    this.moveMessageToAcknowledgmentQueue(msg, multi);
    this.cleanProcessingQueue(keyQueueProcessing, multi);
    this.instance.emit(
      events.PRE_MESSAGE_ACKNOWLEDGED,
      msg,
      this.queueName,
      multi,
    );
    client.execMulti(multi, (err) => cb(err));
  }

  unacknowledgeMessage(
    client: RedisClient,
    msg: Message,
    failure: EMessageUnacknowledgedCause,
    consumerOptions: TConsumerOptions,
    error?: Error,
  ): void {
    if (error) this.logger.error(error);
    this.logger.debug(`Unacknowledging message [${msg.getId()}]...`);
    const { keyQueueProcessing } = this.instance.getInstanceRedisKeys();
    this.retry(
      client,
      msg,
      keyQueueProcessing,
      consumerOptions,
      failure,
      (err) => {
        if (err) this.instance.emit(events.ERROR, err);
        else this.instance.emit(events.MESSAGE_UNACKNOWLEDGED, msg, failure);
      },
    );
  }

  protected applyConsumerOptions(
    msg: Message,
    consumerOptions: TConsumerOptions,
  ): void {
    const {
      messageConsumeTimeout,
      messageRetryDelay,
      messageRetryThreshold,
      messageTTL,
    } = consumerOptions;
    if (msg.getTTL() === null) {
      msg.setTTL(messageTTL);
    }
    if (msg.getRetryDelay() === null) {
      msg.setRetryDelay(messageRetryDelay);
    }
    if (msg.getConsumeTimeout() === null) {
      msg.setConsumeTimeout(messageConsumeTimeout);
    }
    if (msg.getRetryThreshold() === null) {
      msg.setRetryThreshold(messageRetryThreshold);
    }
  }

  /**
   * Move the message to DLQ queue when max attempts threshold is reached or otherwise re-queue it again.
   * Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such messages
   * are periodically scheduled for delivery.
   */
  retry(
    client: RedisClient,
    message: Message,
    processingQueue: string,
    consumerOptions: TConsumerOptions,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void | string>,
  ): void {
    this.applyConsumerOptions(message, consumerOptions);
    const multi = client.multi();
    this.cleanProcessingQueue(processingQueue, multi);
    let scheduled = false;
    let requeued = false;
    let deadLetter = false;
    if (message.hasExpired()) {
      this.logger.debug(
        `Message ID [${message.getId()}] has expired. Moving it to DLQ...`,
      );
      this.moveMessageToDLQQueue(
        message,
        EMessageDeadLetterCause.TTL_EXPIRED,
        multi,
      );
      deadLetter = true;
    } else if (this.schedulerInstance.isPeriodic(message)) {
      this.logger.debug(
        `Message ID [${message.getId()}] is periodic. Moving it to DLQ...`,
      );
      this.moveMessageToDLQQueue(
        message,
        EMessageDeadLetterCause.PERIODIC_MESSAGE,
        multi,
      );
      deadLetter = true;
    } else {
      this.instance.emit(
        events.PRE_MESSAGE_UNACKNOWLEDGED,
        message,
        this.queueName,
        unacknowledgedCause,
        multi,
      );
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
          this.enqueueMessage(message, multi);
          requeued = true;
        }
      } else {
        this.logger.debug(
          `Message ID [${message.getId()}] retry threshold exceeded. Moving message to DLQ...`,
        );
        this.moveMessageToDLQQueue(
          message,
          EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
          multi,
        );
        deadLetter = true;
      }
      client.execMulti(multi, (err) => {
        if (err) cb(err);
        else {
          if (requeued) {
            this.instance.emit(events.MESSAGE_RETRY, message);
          } else if (scheduled) {
            this.instance.emit(events.MESSAGE_RETRY_AFTER_DELAY, message);
          } else if (deadLetter) {
            this.instance.emit(events.MESSAGE_DEAD_LETTER, message);
          }
          cb();
        }
      });
    }
  }
}
