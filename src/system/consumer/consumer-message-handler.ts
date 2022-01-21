import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TConsumerMessageHandler,
  TQueueConsumerRedisKeys,
  TQueueParams,
} from '../../../types';
import { RedisClient } from '../common/redis-client/redis-client';
import { Message } from '../message';
import { events } from '../common/events';
import { ConsumerError } from './consumer.error';
import BLogger from 'bunyan';
import { Broker } from '../common/broker';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { PowerManager } from '../common/power-manager/power-manager';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { ConsumerMessageRate } from './consumer-message-rate';
import { QueueManager } from '../queue-manager/queue-manager';
import * as async from 'async';
import { consumerQueues } from './consumer-queues';

export class ConsumerMessageHandler extends EventEmitter {
  protected consumerId: string;
  protected queue: TQueueParams;
  protected handler: TConsumerMessageHandler;
  protected logger: BLogger;
  protected broker: Broker;
  protected redisClient: RedisClient;
  protected redisKeys: TQueueConsumerRedisKeys;
  protected powerManager: PowerManager;
  protected messageRate: ConsumerMessageRate | null = null;
  protected usingPriorityQueuing: boolean;

  constructor(
    consumerId: string,
    queue: TQueueParams,
    logger: BLogger,
    handler: TConsumerMessageHandler,
    broker: Broker,
    usePriorityQueuing: boolean,
    redisClient: RedisClient,
    messageRate: ConsumerMessageRate | null = null,
  ) {
    super();
    this.consumerId = consumerId;
    this.queue = QueueManager.getQueueParams(queue);
    this.handler = handler;
    this.logger = logger;
    this.broker = broker;
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getQueueConsumerKeys(
      this.queue.name,
      this.consumerId,
      this.queue.ns,
    );
    this.powerManager = new PowerManager();
    this.usingPriorityQueuing = usePriorityQueuing;
    this.registerEventsHandlers();
    if (messageRate) {
      this.messageRate = messageRate;
      messageRate.on(events.IDLE, () => this.emit(events.IDLE));
    }
  }

  protected setUpMessageQueue = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up message queue (${this.queue})...`);
    this.broker.setUpMessageQueue(this.queue, (err) => cb(err));
  };

  protected setUpProcessingQueue = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up consumer processing queue...`);
    QueueManager.setUpProcessingQueue(this, this.redisClient, cb);
  };

  protected addQueueConsumer = (cb: ICallback<void>): void => {
    consumerQueues.addConsumer(
      this.redisClient,
      this.queue,
      this.consumerId,
      cb,
    );
  };

  protected registerEventsHandlers(): void {
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.logger.info('Waiting for new messages...');
        this.broker.dequeueMessage(this, this.redisClient, (err, msgStr) => {
          if (err) this.emit(events.ERROR, err);
          else if (!msgStr)
            this.emit(events.ERROR, new EmptyCallbackReplyError());
          else this.handleReceivedMessage(msgStr);
        });
      } else {
        this.logger.info('Consumer is not running. End of cycle.');
      }
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
      this.logger.info(`Message (ID ${msg.getId()}) has been acknowledged.`);
      if (this.messageRate) this.messageRate.incrementAcknowledged();
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(
      events.MESSAGE_DEAD_LETTERED,
      (msg: Message, cause: EMessageDeadLetterCause) => {
        this.logger.info(
          `Message (ID ${msg.getId()}) has been dead-lettered. Cause: ${cause}.`,
        );
        if (this.messageRate) this.messageRate.incrementDeadLettered();
      },
    );
    this.on(
      events.MESSAGE_UNACKNOWLEDGED,
      (msg: Message, cause: EMessageUnacknowledgedCause) => {
        this.logger.info(
          `Message (ID ${msg.getId()}) has been unacknowledged. Cause: ${cause}.`,
        );
        this.emit(events.MESSAGE_NEXT);
      },
    );
  }

  protected unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
    err?: Error,
  ): void {
    const { keyQueueProcessing } = this.redisKeys;
    this.broker.unacknowledgeMessage(
      keyQueueProcessing,
      msg,
      cause,
      err,
      (err, deadLetterCause) => {
        if (err) this.emit(events.ERROR, err);
        else {
          this.emit(events.MESSAGE_UNACKNOWLEDGED, msg, cause);
          if (deadLetterCause !== undefined) {
            this.emit(events.MESSAGE_DEAD_LETTERED, msg, deadLetterCause);
          }
        }
      },
    );
  }

  protected handleReceivedMessage(json: string): void {
    const message = Message.createFromMessage(json);
    this.logger.info(`Got a new message (ID ${message.getId()})...`);
    this.emit(events.MESSAGE_RECEIVED, message);
    if (message.hasExpired()) {
      this.logger.info(
        `Message (ID ${message.getId()}) has expired. Unacknowledging...`,
      );
      this.unacknowledgeMessage(
        message,
        EMessageUnacknowledgedCause.TTL_EXPIRED,
      );
    } else {
      this.logger.info(`Trying to consume message (ID ${message.getId()})...`);
      this.handleConsume(message);
    }
  }

  protected handleConsume(msg: Message): void {
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    this.logger.info(`Processing message (ID ${msg.getId()})...`);
    try {
      const consumeTimeout = msg.getConsumeTimeout();
      if (consumeTimeout) {
        timer = setTimeout(() => {
          isTimeout = true;
          timer = null;
          this.unacknowledgeMessage(msg, EMessageUnacknowledgedCause.TIMEOUT);
        }, consumeTimeout);
      }
      const onConsumed = (err?: Error | null) => {
        if (this.powerManager.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err)
            this.unacknowledgeMessage(
              msg,
              EMessageUnacknowledgedCause.UNACKNOWLEDGED,
              err,
            );
          else {
            const { keyQueueProcessing } = this.redisKeys;
            this.broker.acknowledgeMessage(keyQueueProcessing, msg, (err) => {
              if (err) this.emit(events.ERROR, err);
              else this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
            });
          }
        }
      };

      // As a safety measure, in case if we mess with message system
      // properties, only a clone of the message is actually given
      this.handler(Message.createFromMessage(msg), onConsumed);
    } catch (error: unknown) {
      const err =
        error instanceof Error
          ? error
          : new ConsumerError(
              `An error occurred while processing message ID (${msg.getId()})`,
            );
      this.unacknowledgeMessage(
        msg,
        EMessageUnacknowledgedCause.CAUGHT_ERROR,
        err,
      );
    }
  }

  run = (cb: ICallback<void>): void => {
    this.powerManager.goingUp();
    async.waterfall(
      [
        (cb: ICallback<void>) => this.setUpMessageQueue((err) => cb(err)),
        (cb: ICallback<void>) => this.addQueueConsumer(cb),
        (cb: ICallback<void>) => this.setUpProcessingQueue((err) => cb(err)),
      ],
      (err) => {
        if (err) cb(err);
        else {
          this.powerManager.commit();
          this.emit(events.MESSAGE_NEXT);
          cb();
        }
      },
    );
  };

  shutdown = (cb: ICallback<void>): void => {
    this.powerManager.goingDown();
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          if (this.messageRate) this.messageRate.quit(cb);
          else cb();
        },
        (cb: ICallback<void>) => this.redisClient.halt(cb),
      ],
      (err) => {
        if (err) cb(err);
        else {
          this.powerManager.commit();
          cb();
        }
      },
    );
  };

  isUsingPriorityQueuing(): boolean {
    return this.usingPriorityQueuing;
  }

  getQueue(): TQueueParams {
    return this.queue;
  }

  getConsumerId(): string {
    return this.consumerId;
  }

  getRedisKeys(): TQueueConsumerRedisKeys {
    return this.redisKeys;
  }
}
