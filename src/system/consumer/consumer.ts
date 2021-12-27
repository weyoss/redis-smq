import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
  TConsumerRedisKeys,
  THeartbeatRegistryPayload,
  TQueueParams,
  TUnaryFunction,
} from '../../../types';
import { Base } from '../base';
import { Message } from '../message';
import { ConsumerMessageRate } from './consumer-message-rate/consumer-message-rate';
import { events } from '../common/events';
import { RedisClient } from '../redis-client/redis-client';
import { resolve } from 'path';
import { ConsumerWorkers } from './consumer-workers';
import { WorkerRunner } from '../common/worker-runner/worker-runner';
import { ConsumerFrontend } from './consumer-frontend';
import { QueueManager } from '../queue-manager/queue-manager';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { ConsumerError } from './consumer.error';
import { PanicError } from '../common/errors/panic.error';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import { heartbeatRegistry } from '../common/heartbeat/heartbeat-registry';

export class Consumer extends Base<ConsumerMessageRate, TConsumerRedisKeys> {
  private consumerRedisClient: RedisClient | null = null;
  private consumerWorkers: ConsumerWorkers | null = null;
  private consumerFrontend: ConsumerFrontend | null = null;

  protected getConsumerRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.consumerRedisClient)
      this.emit(
        events.ERROR,
        new PanicError('Expected an instance of RedisClient'),
      );
    else cb(this.consumerRedisClient);
  }

  protected handleConsume(msg: Message): void {
    if (!this.consumerFrontend || !this.consumerFrontend.consume) {
      throw new PanicError('Expected an instance of ConsumeHandler');
    }
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
          else
            this.getBroker((broker) => {
              const { keyQueueProcessing } = this.getRedisKeys();
              broker.acknowledgeMessage(keyQueueProcessing, msg, (err) => {
                if (err) this.emit(events.ERROR, err);
                else this.emit(events.MESSAGE_ACKNOWLEDGED, msg);
              });
            });
        }
      };

      // As a safety measure, in case if we mess with message system
      // properties, only a clone of the message is actually given
      this.consumerFrontend.consume(Message.createFromMessage(msg), onConsumed);
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

  protected unacknowledgeMessage(
    msg: Message,
    cause: EMessageUnacknowledgedCause,
    err?: Error,
  ): void {
    this.getBroker((broker) => {
      const { keyQueueProcessing } = this.getRedisKeys();
      broker.unacknowledgeMessage(
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
    });
  }

  protected registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.on(events.UP, () => this.emit(events.MESSAGE_NEXT));
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.logger.info('Waiting for new messages...');
        this.getConsumerRedisClient((client) => {
          this.getBroker((broker) => {
            broker.dequeueMessage(this, client, (err, msgStr) => {
              if (err) this.emit(events.ERROR, err);
              else if (!msgStr)
                this.emit(events.ERROR, new EmptyCallbackReplyError());
              else this.handleReceivedMessage(msgStr);
            });
          });
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

  protected handleReceivedMessage(json: string): void {
    const message = Message.createFromMessage(json);
    this.logger.info(`Got a new message (ID ${message.getId()})...`);
    this.emit(events.MESSAGE_DEQUEUED, message);
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

  protected goingUp(): TUnaryFunction<ICallback<void>>[] {
    const setUpConsumerRedisClient = (cb: ICallback<void>): void => {
      this.logger.debug(`Set up consumer RedisClient instance...`);
      RedisClient.getNewInstance(this.config, (err, client) => {
        if (err) cb(err);
        else if (!client) cb(new EmptyCallbackReplyError());
        else {
          this.consumerRedisClient = client;
          cb();
        }
      });
    };
    const setUpConsumerWorkers = (cb: ICallback<void>) => {
      this.logger.debug(`Set up consumer workers...`);
      this.getSharedRedisClient((client) => {
        this.consumerWorkers = new ConsumerWorkers(
          this.id,
          resolve(`${__dirname}/../workers`),
          this.config,
          client,
          new WorkerRunner(),
          this.logger,
        );
        this.consumerWorkers.on(events.ERROR, (err: Error) =>
          this.emit(events.ERROR, err),
        );
        cb();
      });
    };
    const setUpConsumerProcessingQueue = (cb: ICallback<void>): void => {
      this.logger.debug(`Set up consumer processing queue...`);
      this.getSharedRedisClient((client) =>
        QueueManager.setUpProcessingQueue(this, client, cb),
      );
    };
    return super
      .goingUp()
      .concat([
        setUpConsumerRedisClient,
        setUpConsumerWorkers,
        setUpConsumerProcessingQueue,
      ]);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    const tearDownConsumerWorkers = (cb: ICallback<void>) => {
      this.logger.debug(`Tear down consumer workers...`);
      if (this.consumerWorkers) {
        this.consumerWorkers.quit(() => {
          this.logger.debug(`Consumer workers has been torn down.`);
          this.consumerWorkers = null;
          cb();
        });
      } else {
        this.logger.warn(
          `This is not normal. [this.consumerWorkers] has not been set up. Ignoring...`,
        );
        cb();
      }
    };
    const tearDownConsumerRedisClient = (cb: ICallback<void>) => {
      this.logger.debug(`Tear down consumer RedisClient instance...`);
      if (this.consumerRedisClient) {
        this.consumerRedisClient.halt(() => {
          this.logger.debug(
            `Consumer RedisClient instance has been torn down.`,
          );
          this.consumerRedisClient = null;
          cb();
        });
      } else {
        this.logger.warn(
          `This is not normal. [this.consumerRedisClient] has not been set up. Ignoring...`,
        );
        cb();
      }
    };
    return [tearDownConsumerWorkers, tearDownConsumerRedisClient].concat(
      super.goingDown(),
    );
  }

  setConsumerFrontend(consumerMessageHandler: ConsumerFrontend): Consumer {
    this.consumerFrontend = consumerMessageHandler;
    return this;
  }

  getMessageRate(redisClient: RedisClient): ConsumerMessageRate {
    return new ConsumerMessageRate(this, redisClient);
  }

  getHeartbeat(redisClient: RedisClient): Heartbeat {
    const { keyHeartbeatConsumer, keyQueueConsumers } = this.getRedisKeys();
    const heartbeat = new Heartbeat(
      {
        keyHeartbeat: keyHeartbeatConsumer,
        keyInstanceRegistry: keyQueueConsumers,
        instanceId: this.getId(),
      },
      redisClient,
    );
    heartbeat.on(events.ERROR, (err: Error) => this.emit(events.ERROR, err));
    return heartbeat;
  }

  getRedisKeys(): TConsumerRedisKeys {
    if (!this.redisKeys) {
      this.redisKeys = redisKeys.getConsumerKeys(
        this.queue.name,
        this.id,
        this.queue.ns,
      );
    }
    return this.redisKeys;
  }

  static isAlive(
    redisClient: RedisClient,
    queue: TQueueParams,
    id: string,
    cb: ICallback<boolean>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getConsumerKeys(
      queue.name,
      id,
      queue.ns,
    );
    heartbeatRegistry.exists(redisClient, keyQueueConsumers, id, cb);
  }

  static getOnlineConsumers(
    redisClient: RedisClient,
    queue: TQueueParams,
    transform = false,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getKeys(queue.name, queue.ns);
    heartbeatRegistry.getAll(redisClient, keyQueueConsumers, transform, cb);
  }

  static countOnlineConsumers(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getKeys(queue.name, queue.ns);
    heartbeatRegistry.count(redisClient, keyQueueConsumers, cb);
  }
}
