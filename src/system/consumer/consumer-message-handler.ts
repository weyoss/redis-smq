import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  ICompatibleLogger,
  TConsumerMessageHandler,
  TQueueConsumerRedisKeys,
  TQueueParams,
} from '../../../types';
import { v4 as uuid } from 'uuid';
import { RedisClient } from '../common/redis-client/redis-client';
import { Message } from '../message/message';
import { events } from '../common/events';
import { ConsumerError } from './consumer.error';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { PowerManager } from '../common/power-manager/power-manager';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { ConsumerMessageRate } from './consumer-message-rate';
import * as async from 'async';
import { consumerQueues } from './consumer-queues';
import { broker } from '../common/broker';
import { queueManager } from '../queue-manager/queue-manager';
import { Ticker } from '../common/ticker/ticker';
import { getNamespacedLogger } from '../common/logger';

export class ConsumerMessageHandler extends EventEmitter {
  protected id: string;
  protected consumerId: string;
  protected queue: TQueueParams;
  protected handler: TConsumerMessageHandler;
  protected redisClient: RedisClient;
  protected redisKeys: TQueueConsumerRedisKeys;
  protected powerManager: PowerManager;
  protected messageRate: ConsumerMessageRate | null = null;
  protected usingPriorityQueuing: boolean;
  protected storeMessages: boolean;
  protected keyQueue: string;
  protected keyQueuePriority: string;
  protected keyPendingMessagesWithPriority: string;
  protected keyQueueProcessing: string;
  protected ticker: Ticker;
  protected logger: ICompatibleLogger;

  constructor(
    consumerId: string,
    queue: TQueueParams,
    handler: TConsumerMessageHandler,
    usePriorityQueuing: boolean,
    storeMessages: boolean,
    redisClient: RedisClient,
    messageRate: ConsumerMessageRate | null = null,
  ) {
    super();
    this.id = uuid();
    this.consumerId = consumerId;
    this.queue = queueManager.getQueueParams(queue);
    this.handler = handler;
    this.redisClient = redisClient;
    this.usingPriorityQueuing = usePriorityQueuing;
    this.storeMessages = storeMessages;
    this.redisKeys = redisKeys.getQueueConsumerKeys(
      this.queue.name,
      this.consumerId,
      this.queue.ns,
    );
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePending,
      keyQueuePendingPriorityMessages,
      keyQueueProcessing,
    } = this.redisKeys;
    this.keyQueue = keyQueuePending;
    this.keyPendingMessagesWithPriority = keyQueuePendingPriorityMessages;
    this.keyQueuePriority = keyQueuePendingPriorityMessageIds;
    this.keyQueueProcessing = keyQueueProcessing;
    this.powerManager = new PowerManager();
    this.logger = getNamespacedLogger(`MessageHandler/${this.id}`);
    this.registerEventsHandlers();
    if (messageRate) {
      this.messageRate = messageRate;
      messageRate.on(events.IDLE, () => {
        this.emit(events.IDLE, this.queue);
      });
    }

    // A ticker is needed for pooling priority queues
    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    this.ticker = new Ticker(() => void 0, 1000);
  }

  protected setUpMessageQueue = (cb: ICallback<void>): void => {
    queueManager.setUpMessageQueue(this.redisClient, this.queue, (err) =>
      cb(err),
    );
  };

  protected setUpProcessingQueue = (cb: ICallback<void>): void => {
    queueManager.setUpProcessingQueue(this, this.redisClient, cb);
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
    this.on(events.UP, () => {
      this.logger.info('Up and running...');
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.dequeue((err, msgStr) => {
          if (err) {
            if (
              this.powerManager.isRunning() ||
              this.powerManager.isGoingUp()
            ) {
              this.emit(events.ERROR, err);
            }
          } else if (!msgStr)
            this.emit(events.ERROR, new EmptyCallbackReplyError());
          else this.handleReceivedMessage(msgStr);
        });
      }
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
      if (this.messageRate) this.messageRate.incrementAcknowledged();
      this.logger.info(`Message (ID ${msg.getRequiredId()}) acknowledged`);
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(
      events.MESSAGE_DEAD_LETTERED,
      (msg: Message, cause: EMessageDeadLetterCause) => {
        if (this.messageRate) this.messageRate.incrementDeadLettered();
        this.logger.info(
          `Message (ID ${msg.getRequiredId()}) dead-lettered (cause ${cause})`,
        );
      },
    );
    this.on(
      events.MESSAGE_UNACKNOWLEDGED,
      (msg: Message, cause: EMessageUnacknowledgedCause) => {
        this.emit(events.MESSAGE_NEXT);
        this.logger.info(
          `Message (ID ${msg.getRequiredId()}) unacknowledged (cause ${cause})`,
        );
      },
    );
    this.on(events.DOWN, () => this.logger.info('Down.'));
  }

  protected unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
    err?: Error,
  ): void {
    if (err) {
      // ...
    }
    const { keyQueueProcessing } = this.redisKeys;
    broker.retry(
      this.redisClient,
      keyQueueProcessing,
      msg,
      cause,
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
    this.emit(events.MESSAGE_RECEIVED, message);
    if (message.getSetExpired()) {
      this.unacknowledgeMessage(
        message,
        EMessageUnacknowledgedCause.TTL_EXPIRED,
      );
    } else this.handleConsume(message);
  }

  protected handleConsume(msg: Message): void {
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    try {
      this.logger.info(
        `Consuming message (ID ${msg.getRequiredId()}) with properties (${msg.toString()})`,
      );
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
            broker.acknowledgeMessage(
              this.redisClient,
              msg,
              keyQueueProcessing,
              this.storeMessages,
              (err) => {
                if (err) this.emit(events.ERROR, err);
                else this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
              },
            );
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
              `An error occurred while processing message ID (${msg.getRequiredId()})`,
            );
      this.unacknowledgeMessage(
        msg,
        EMessageUnacknowledgedCause.CAUGHT_ERROR,
        err,
      );
    }
  }

  protected dequeueMessageWithPriority(cb: ICallback<string>): void {
    this.redisClient.zpophgetrpush(
      this.keyQueuePriority,
      this.keyPendingMessagesWithPriority,
      this.keyQueueProcessing,
      (err, reply) => {
        if (err) {
          this.ticker.abort();
          cb(err);
        } else if (typeof reply === 'string') {
          cb(null, reply);
        } else {
          this.ticker.nextTickFn(() => {
            this.dequeueMessageWithPriority(cb);
          });
        }
      },
    );
  }

  protected dequeueMessage(cb: ICallback<string>): void {
    this.redisClient.brpoplpush(
      this.keyQueue,
      this.keyQueueProcessing,
      0,
      (err, reply) => {
        if (err) {
          this.ticker.abort();
          cb(err);
        } else cb(null, reply);
      },
    );
  }

  protected dequeue(cb: ICallback<string>): void {
    if (this.usingPriorityQueuing) this.dequeueMessageWithPriority(cb);
    else this.dequeueMessage(cb);
  }

  run = (cb: ICallback<void>): void => {
    this.powerManager.goingUp();
    async.waterfall(
      [
        (cb: ICallback<void>) => this.setUpMessageQueue(cb),
        (cb: ICallback<void>) => this.addQueueConsumer(cb),
        (cb: ICallback<void>) => this.setUpProcessingQueue(cb),
      ],
      (err) => {
        if (err) cb(err);
        else {
          this.powerManager.commit();
          this.emit(events.UP);
          cb();
        }
      },
    );
  };

  shutdown = (cb: ICallback<void>): void => {
    const goDown = () => {
      this.powerManager.goingDown();
      async.waterfall(
        [
          (cb: ICallback<void>) => {
            this.ticker.once(events.DOWN, cb);
            this.ticker.quit();
          },
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
            this.emit(events.DOWN);
            cb();
          }
        },
      );
    };
    if (this.powerManager.isGoingUp()) this.once(events.UP, goDown);
    else goDown();
  };

  getQueue(): TQueueParams {
    return this.queue;
  }

  isUsingPriorityQueuing(): boolean {
    return this.usingPriorityQueuing;
  }

  getConsumerId(): string {
    return this.consumerId;
  }

  getRedisKeys(): TQueueConsumerRedisKeys {
    return this.redisKeys;
  }

  getId(): string {
    return this.id;
  }
}
