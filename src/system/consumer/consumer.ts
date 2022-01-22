import {
  ICallback,
  IConfig,
  TConsumerMessageHandler,
  TConsumerMessageHandlerParams,
  TConsumerRedisKeys,
  THeartbeatRegistryPayload,
  TQueueParams,
  TUnaryFunction,
} from '../../../types';
import { ConsumerMessageRate } from './consumer-message-rate';
import { events } from '../common/events';
import { RedisClient } from '../common/redis-client/redis-client';
import { resolve } from 'path';
import { ConsumerWorkers } from './consumer-workers';
import { WorkerRunner } from '../common/worker-runner/worker-runner';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { ConsumerHeartbeat } from './consumer-heartbeat';
import { ConsumerMessageRateWriter } from './consumer-message-rate-writer';
import { Base } from '../common/base';
import { ConsumerMessageHandler } from './consumer-message-handler';
import * as async from 'async';
import { consumerQueues } from './consumer-queues';
import { QueueManager } from '../queue-manager/queue-manager';
import { GenericError } from '../common/errors/generic.error';

export class Consumer extends Base {
  private heartbeat: ConsumerHeartbeat | null = null;
  private consumerWorkers: ConsumerWorkers | null = null;
  private messageHandlerInstances: ConsumerMessageHandler[] = [];
  private messageHandlers: TConsumerMessageHandlerParams[] = [];
  private redisKeys: TConsumerRedisKeys;

  constructor(config: IConfig = {}) {
    super(config);
    this.redisKeys = redisKeys.getConsumerKeys(this.getId());
    this.on(events.UP, () => {
      this.consumeMessages((err) => {
        if (err) this.emit(events.ERROR, err);
      });
    });
  }

  protected registerMessageHandlerEvents = (
    messageHandler: ConsumerMessageHandler,
  ): void => {
    messageHandler.on(events.ERROR, (...args: unknown[]) =>
      this.emit(events.ERROR, ...args),
    );
    messageHandler.on(events.IDLE, (...args: unknown[]) =>
      this.emit(events.IDLE, ...args),
    );
    messageHandler.on(events.MESSAGE_UNACKNOWLEDGED, (...args: unknown[]) =>
      this.emit(events.MESSAGE_UNACKNOWLEDGED, ...args),
    );
    messageHandler.on(events.MESSAGE_DEAD_LETTERED, (...args: unknown[]) =>
      this.emit(events.MESSAGE_DEAD_LETTERED, ...args),
    );
    messageHandler.on(events.MESSAGE_ACKNOWLEDGED, (...args: unknown[]) =>
      this.emit(events.MESSAGE_ACKNOWLEDGED, ...args),
    );
  };

  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up consumer heartbeat...`);
    RedisClient.getNewInstance(this.config, (err, redisClient) => {
      if (err) cb(err);
      else if (!redisClient) cb(new EmptyCallbackReplyError());
      else {
        this.heartbeat = new ConsumerHeartbeat(this, redisClient);
        this.heartbeat.on(events.ERROR, (err: Error) =>
          this.emit(events.ERROR, err),
        );
        cb();
      }
    });
  };

  protected tearDownHeartbeat = (cb: ICallback<void>): void => {
    this.logger.debug(`Tear down consumer heartbeat...`);
    if (this.heartbeat) {
      this.heartbeat.quit(() => {
        this.logger.debug(`Consumer heartbeat has been torn down.`);
        this.heartbeat = null;
        cb();
      });
    } else {
      this.logger.warn(
        `This is not normal. [this.heartbeat] has not been set up. Ignoring...`,
      );
      cb();
    }
  };

  protected setUpConsumerWorkers = (cb: ICallback<void>): void => {
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

  protected tearDownConsumerWorkers = (cb: ICallback<void>): void => {
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

  protected runMessageHandler = (
    handlerParams: TConsumerMessageHandlerParams,
    cb: ICallback<void>,
  ) => {
    this.getBroker((broker) => {
      RedisClient.getNewInstance(this.config, (err, redisClient) => {
        if (err) cb(err);
        else if (!redisClient) cb(new EmptyCallbackReplyError());
        else {
          this.getSharedRedisClient((sharedRedisClient) => {
            const { queue, usePriorityQueuing, messageHandler } = handlerParams;
            const messageRate = this.config.monitor?.enabled
              ? this.getMessageRateInstance(queue, sharedRedisClient)
              : null;
            const handler = new ConsumerMessageHandler(
              this.id,
              queue,
              this.logger,
              messageHandler,
              broker,
              usePriorityQueuing,
              redisClient,
              messageRate,
            );
            this.messageHandlerInstances.push(handler);
            this.registerMessageHandlerEvents(handler);
            handler.run(cb);
          });
        }
      });
    });
  };

  protected consumeMessages = (cb: ICallback<void>): void => {
    async.each<TConsumerMessageHandlerParams, Error>(
      this.messageHandlers,
      (handlerParams, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      cb,
    );
  };

  protected tearDownMessageHandlerInstances = (cb: ICallback<void>): void => {
    async.eachOf<ConsumerMessageHandler, Error>(
      this.messageHandlerInstances,
      (handler, queue, done) => {
        handler.shutdown(done);
      },
      (err) => {
        if (err) cb(err);
        else {
          this.messageHandlerInstances = [];
          cb();
        }
      },
    );
  };

  protected getMessageRateInstance = (
    queue: TQueueParams,
    redisClient: RedisClient,
  ): ConsumerMessageRate => {
    const messageRateWriter = new ConsumerMessageRateWriter(
      redisClient,
      queue,
      this.id,
    );
    return new ConsumerMessageRate(messageRateWriter);
  };

  protected goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super
      .goingUp()
      .concat([this.setUpConsumerWorkers, this.setUpHeartbeat]);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [
      this.tearDownConsumerWorkers,
      this.tearDownMessageHandlerInstances,
      this.tearDownHeartbeat,
    ].concat(super.goingDown());
  }

  protected up(cb?: ICallback<boolean>): void {
    this.heartbeat?.once(events.HEARTBEAT_TICK, () => {
      super.up(cb);
    });
  }

  protected addMessageHandler(
    handlerParams: TConsumerMessageHandlerParams,
  ): boolean {
    const { queue } = handlerParams;
    const existing = this.messageHandlers.find(
      (i) => i.queue.name === queue.name && i.queue.ns === queue.ns,
    );
    if (existing) return false;
    this.messageHandlers.push(handlerParams);
    return true;
  }

  consume(
    queue: string | TQueueParams,
    usePriorityQueuing: boolean,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = QueueManager.getQueueParams(queue);
    const handlerParams = {
      queue: queueParams,
      usePriorityQueuing,
      messageHandler,
    };
    const r = this.addMessageHandler(handlerParams);
    if (!r)
      cb(
        new GenericError(
          `Queue [${JSON.stringify(
            queueParams,
          )}] has already a message handler`,
        ),
      );
    else {
      if (this.isRunning())
        this.runMessageHandler(handlerParams, (err) => {
          if (err) cb(err);
          else cb(null, true);
        });
      else cb(null, false);
    }
  }

  getRedisKeys(): TConsumerRedisKeys {
    return this.redisKeys;
  }

  getQueues(): TQueueParams[] {
    return this.messageHandlers.map((i) => i.queue);
  }

  static isAlive(
    redisClient: RedisClient,
    queue: TQueueParams,
    id: string,
    cb: ICallback<boolean>,
  ): void {
    const { keyQueueConsumers } = redisKeys.getQueueConsumerKeys(
      queue.name,
      id,
      queue.ns,
    );
    consumerQueues.exists(redisClient, keyQueueConsumers, id, cb);
  }

  static getOnlineConsumers(
    redisClient: RedisClient,
    queue: TQueueParams,
    transform = false,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    consumerQueues.getQueueConsumers(redisClient, queue, transform, cb);
  }

  static getOnlineConsumerIds(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<string[]>,
  ): void {
    consumerQueues.getQueueConsumerIds(redisClient, queue, cb);
  }

  static countOnlineConsumers(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    consumerQueues.countQueueConsumers(redisClient, queue, cb);
  }
}
