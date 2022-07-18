import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  IRequiredConfig,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../../types';
import { v4 as uuid } from 'uuid';
import { Message } from '../../message/message';
import { events } from '../../../common/events/events';
import { EventEmitter } from 'events';
import { consumerQueues } from '../consumer-queues';
import { processingQueue, TCleanUpStatus } from './processing-queue';
import { DequeueMessage } from './dequeue-message';
import { ConsumeMessage } from './consume-message';
import { Consumer } from '../consumer';
import { async, PowerManager, RedisClient } from 'redis-smq-common';
import {
  ICallback,
  ICompatibleLogger,
  IRedisClientMulti,
} from 'redis-smq-common/dist/types';
import { ERetryStatus } from './retry-message';

export class MessageHandler extends EventEmitter {
  protected id: string;
  protected consumer: Consumer;
  protected consumerId: string;
  protected queue: TQueueParams;
  protected dequeueRedisClient: RedisClient;
  protected sharedRedisClient: RedisClient;
  protected powerManager: PowerManager;
  protected logger: ICompatibleLogger;
  protected dequeueMessage: DequeueMessage;
  protected consumeMessage: ConsumeMessage;
  protected handler: TConsumerMessageHandler;

  constructor(
    consumer: Consumer,
    queue: TQueueParams,
    handler: TConsumerMessageHandler,
    dequeueRedisClient: RedisClient,
    sharedRedisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    super();
    this.id = uuid();
    this.consumer = consumer;
    this.consumerId = consumer.getId();
    this.queue = queue;
    this.dequeueRedisClient = dequeueRedisClient;
    this.sharedRedisClient = sharedRedisClient;
    this.handler = handler;
    this.powerManager = new PowerManager();
    this.logger = logger;
    this.dequeueMessage = new DequeueMessage(this, dequeueRedisClient);
    this.consumeMessage = new ConsumeMessage(this, dequeueRedisClient, logger);
    this.registerEventsHandlers();
  }

  protected registerEventsHandlers(): void {
    this.on(events.UP, () => {
      this.logger.info('Up and running...');
      this.dequeueMessage.dequeue();
    });
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.dequeueMessage.dequeue();
      }
    });
    this.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
      this.logger.info(`Message (ID ${msg.getRequiredId()}) acknowledged`);
      this.emit(events.MESSAGE_NEXT);
    });
    this.on(
      events.MESSAGE_DEAD_LETTERED,
      (msg: Message, cause: EMessageDeadLetterCause) => {
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
    this.on(events.MESSAGE_RECEIVED, (msg: Message) => {
      if (this.powerManager.isRunning()) {
        this.logger.info(
          `Consuming message (ID ${msg.getRequiredId()}) with properties (${msg.toString()})`,
        );
        this.consumeMessage.handleReceivedMessage(msg);
      }
    });
    this.on(events.DOWN, () => this.logger.info('Down.'));
  }

  protected cleanUp(cb: ICallback<void>): void {
    MessageHandler.cleanUp(
      this.getConfig(),
      this.sharedRedisClient,
      this.consumerId,
      this.queue,
      undefined,
      (err, reply) => {
        if (err) cb(err);
        else if (reply) {
          this.logger.debug(
            `Message ID ${reply.message.getId()} has been ${
              reply.status === ERetryStatus.MESSAGE_DEAD_LETTERED
                ? 'dead-lettered'
                : 'unacknowledged'
            }.`,
          );
          cb();
        } else cb();
      },
    );
  }

  handleError(err: Error): void {
    if (this.powerManager.isRunning() || this.powerManager.isGoingUp()) {
      this.emit(events.ERROR, err);
    }
  }

  dequeue(): void {
    this.dequeueMessage.dequeue();
  }

  run(cb: ICallback<void>): void {
    this.powerManager.goingUp();
    this.dequeueMessage.run((err) => {
      if (err) cb(err);
      else {
        this.powerManager.commit();
        this.emit(events.UP);
        cb();
      }
    });
  }

  shutdown(cb: ICallback<void>): void {
    const goDown = () => {
      this.powerManager.goingDown();
      async.waterfall(
        [
          (cb: ICallback<void>) => this.dequeueMessage.quit(cb),
          (cb: ICallback<void>) => this.cleanUp(cb),
          (cb: ICallback<void>) => this.dequeueRedisClient.halt(cb),
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
  }

  getQueue(): TQueueParams {
    return this.queue;
  }

  getConsumerId(): string {
    return this.consumerId;
  }

  getId(): string {
    return this.id;
  }

  getConfig(): IRequiredConfig {
    return this.consumer.getConfig();
  }

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  getHandler(): TConsumerMessageHandler {
    return this.handler;
  }

  static cleanUp(
    config: IRequiredConfig,
    redisClient: RedisClient,
    consumerId: string,
    queue: TQueueParams,
    pendingMulti: IRedisClientMulti | undefined,
    cb: ICallback<TCleanUpStatus>,
  ): void {
    const multi = pendingMulti ?? redisClient.multi();
    let status: TCleanUpStatus = false;
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          processingQueue.cleanUpProcessingQueue(
            config,
            redisClient,
            consumerId,
            queue,
            multi,
            (err, reply) => {
              if (err) cb(err);
              else {
                status = reply ?? false;
                cb();
              }
            },
          );
        },
        (cb: ICallback<void>) => {
          consumerQueues.removeConsumer(multi, queue, consumerId);
          cb();
        },
      ],
      (err) => {
        if (err) cb(err);
        else if (pendingMulti) cb(null, status);
        else
          multi.exec((err) => {
            if (err) cb(err);
            else cb(null, status);
          });
      },
    );
  }
}
