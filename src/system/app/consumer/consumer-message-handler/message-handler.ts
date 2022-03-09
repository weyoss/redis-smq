import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  ICompatibleLogger,
  TConsumerMessageHandler,
  TQueueParams,
  TRedisClientMulti,
} from '../../../../../types';
import { v4 as uuid } from 'uuid';
import { RedisClient } from '../../../common/redis-client/redis-client';
import { Message } from '../../message/message';
import { events } from '../../../common/events';
import { EventEmitter } from 'events';
import { PowerManager } from '../../../common/power-manager/power-manager';
import { ConsumerMessageRate } from '../consumer-message-rate';
import { consumerQueues } from '../consumer-queues';
import { queueManager } from '../../queue-manager/queue-manager';
import { getNamespacedLogger } from '../../../common/logger';
import { waterfall } from '../../../lib/async';
import { processingQueue } from './processing-queue';
import { DequeueMessage } from './dequeue-message';
import { ConsumeMessage } from './consume-message';

export class MessageHandler extends EventEmitter {
  protected id: string;
  protected consumerId: string;
  protected queue: TQueueParams;
  protected redisClient: RedisClient;
  protected powerManager: PowerManager;
  protected messageRate: ConsumerMessageRate | null = null;
  protected usingPriorityQueuing: boolean;
  protected logger: ICompatibleLogger;
  protected dequeueMessage: DequeueMessage;
  protected consumeMessage: ConsumeMessage;
  protected handler: TConsumerMessageHandler;

  constructor(
    consumerId: string,
    queue: TQueueParams,
    handler: TConsumerMessageHandler,
    usePriorityQueuing: boolean,
    redisClient: RedisClient,
    messageRate: ConsumerMessageRate | null = null,
  ) {
    super();
    this.id = uuid();
    this.consumerId = consumerId;
    this.queue = queueManager.getQueueParams(queue);
    this.redisClient = redisClient;
    this.usingPriorityQueuing = usePriorityQueuing;
    this.handler = handler;
    this.powerManager = new PowerManager();
    this.logger = getNamespacedLogger(`MessageHandler/${this.id}`);
    this.dequeueMessage = new DequeueMessage(this, redisClient);
    this.consumeMessage = new ConsumeMessage(this, redisClient);
    this.registerEventsHandlers();
    this.messageRate = messageRate;
    if (this.messageRate) {
      this.messageRate.on(events.IDLE, () => {
        this.emit(events.IDLE, this.queue);
      });
    }
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

  // The message handler could be blocking its redis connection when waiting for new messages using brpoplpush
  // Therefore, once the handler is up and running, no other redis commands can be executed
  shutdown(redisClient: RedisClient, cb: ICallback<void>): void {
    const goDown = () => {
      this.powerManager.goingDown();
      waterfall(
        [
          (cb: ICallback<void>) => {
            this.dequeueMessage.quit(cb);
          },
          (cb: ICallback<void>) => {
            if (this.messageRate) this.messageRate.quit(cb);
            else cb();
          },
          (cb: ICallback<void>) => {
            MessageHandler.cleanUp(
              redisClient,
              this.consumerId,
              this.queue,
              undefined,
              cb,
            );
          },
          (cb: ICallback<void>) => {
            this.redisClient.halt(cb);
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

  isUsingPriorityQueuing(): boolean {
    return this.usingPriorityQueuing;
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

  static cleanUp(
    redisClient: RedisClient,
    consumerId: string,
    queue: TQueueParams,
    pendingMulti: TRedisClientMulti | undefined,
    cb: ICallback<void>,
  ): void {
    const multi = pendingMulti ?? redisClient.multi();
    waterfall(
      [
        (cb: ICallback<void>) => {
          processingQueue.cleanUpProcessingQueue(
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
        else redisClient.execMulti(multi, (err) => cb(err));
      },
    );
  }
}
