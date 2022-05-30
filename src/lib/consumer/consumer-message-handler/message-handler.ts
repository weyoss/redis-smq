import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  IPlugin,
  IRequiredConfig,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../../types';
import { v4 as uuid } from 'uuid';
import { Message } from '../../message/message';
import { events } from '../../../common/events/events';
import { EventEmitter } from 'events';
import { consumerQueues } from '../consumer-queues';
import { processingQueue } from './processing-queue';
import { DequeueMessage } from './dequeue-message';
import { ConsumeMessage } from './consume-message';
import { getConsumerPlugins } from '../../../plugins/plugins';
import { Consumer } from '../consumer';
import { async, PowerManager, RedisClient } from 'redis-smq-common';
import {
  ICallback,
  ICompatibleLogger,
  IRedisClientMulti,
} from 'redis-smq-common/dist/types';

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
  protected plugins: IPlugin[] = [];

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
    this.consumeMessage = new ConsumeMessage(this, dequeueRedisClient);
    this.registerEventsHandlers();
    this.initPlugins();
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

  protected initPlugins(): void {
    getConsumerPlugins().forEach((ctor) => {
      const plugin = new ctor(
        this.sharedRedisClient,
        this.queue,
        this.consumer,
      );
      this.plugins.push(plugin);
    });
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
          (cb: ICallback<void>) => {
            this.dequeueMessage.quit(cb);
          },
          (cb: ICallback<void>) => {
            async.each(
              this.plugins,
              (plugin, index, done) => plugin.quit(done),
              (err) => {
                if (err) cb(err);
                else {
                  this.plugins = [];
                  cb();
                }
              },
            );
          },
          (cb: ICallback<void>) => {
            MessageHandler.cleanUp(
              this.getConfig(),
              this.sharedRedisClient,
              this.consumerId,
              this.queue,
              undefined,
              cb,
            );
          },
          (cb: ICallback<void>) => {
            this.dequeueRedisClient.halt(cb);
          },
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
    cb: ICallback<void>,
  ): void {
    const multi = pendingMulti ?? redisClient.multi();
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          processingQueue.cleanUpProcessingQueue(
            config,
            redisClient,
            consumerId,
            queue,
            multi,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          consumerQueues.removeConsumer(multi, queue, consumerId);
          cb();
        },
      ],
      (err) => {
        if (err) cb(err);
        else if (pendingMulti) cb();
        else multi.exec((err) => cb(err));
      },
    );
  }
}
