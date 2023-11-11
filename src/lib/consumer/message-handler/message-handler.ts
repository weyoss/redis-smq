import {
  EConsumeMessageDeadLetterCause,
  EConsumeMessageUnacknowledgedCause,
  TConsumerMessageHandler,
  IQueueParams,
} from '../../../../types';
import { v4 as uuid } from 'uuid';
import { Message } from '../../message/message';
import { events } from '../../../common/events/events';
import { EventEmitter } from 'events';
import { processingQueue } from './processing-queue';
import { DequeueMessage } from './dequeue-message';
import { ConsumeMessage } from './consume-message';
import { Consumer } from '../consumer';
import {
  async,
  PowerManager,
  RedisClient,
  ICallback,
  ILogger,
} from 'redis-smq-common';

export class MessageHandler extends EventEmitter {
  protected id: string;
  protected consumer: Consumer;
  protected consumerId: string;
  protected queue: IQueueParams;
  protected dequeueRedisClient: RedisClient;
  protected sharedRedisClient: RedisClient;
  protected powerManager: PowerManager;
  protected logger: ILogger;
  protected dequeueMessage: DequeueMessage;
  protected consumeMessage: ConsumeMessage;
  protected handler: TConsumerMessageHandler;

  constructor(
    consumer: Consumer,
    queue: IQueueParams,
    handler: TConsumerMessageHandler,
    dequeueRedisClient: RedisClient,
    sharedRedisClient: RedisClient,
    logger: ILogger,
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
      (msg: Message, cause: EConsumeMessageDeadLetterCause) => {
        this.logger.info(
          `Message (ID ${msg.getRequiredId()}) dead-lettered (cause ${cause})`,
        );
      },
    );
    this.on(
      events.MESSAGE_UNACKNOWLEDGED,
      (msg: Message, cause: EConsumeMessageUnacknowledgedCause) => {
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

  protected cleanUp(
    messageUnacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    processingQueue.handleProcessingQueue(
      this.sharedRedisClient,
      [this.consumerId],
      [this.queue],
      this.logger,
      messageUnacknowledgedCause,
      (err) => cb(err),
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

  shutdown(
    messageUnacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const goDown = () => {
      this.powerManager.goingDown();
      async.waterfall(
        [
          (cb: ICallback<void>) => this.dequeueMessage.quit(cb),
          (cb: ICallback<void>) => this.cleanUp(messageUnacknowledgedCause, cb),
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

  getQueue(): IQueueParams {
    return this.queue;
  }

  getConsumerId(): string {
    return this.consumerId;
  }

  getId(): string {
    return this.id;
  }

  isRunning(): boolean {
    return this.powerManager.isRunning();
  }

  getHandler(): TConsumerMessageHandler {
    return this.handler;
  }
}
