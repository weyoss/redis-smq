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
  private readonly redisKeys: TConsumerRedisKeys;

  constructor(config: IConfig = {}) {
    super(config);
    this.redisKeys = redisKeys.getConsumerKeys(this.getId());
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
        this.heartbeat.once(events.HEARTBEAT_TICK, () => cb());
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
      this.logger.warn(`this.consumerWorkers has not been set up. Ignoring...`);
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
            this.registerMessageHandlerEvents(handler);
            this.messageHandlerInstances.push(handler);
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
      .concat([
        this.setUpHeartbeat,
        this.consumeMessages,
        this.setUpConsumerWorkers,
      ]);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [
      this.tearDownConsumerWorkers,
      this.tearDownMessageHandlerInstances,
      this.tearDownHeartbeat,
    ].concat(super.goingDown());
  }

  protected getMessageHandler(
    queue: TQueueParams,
    usePriorityQueuing: boolean,
  ): TConsumerMessageHandlerParams | undefined {
    return this.messageHandlers.find(
      (i) =>
        i.queue.name === queue.name &&
        i.queue.ns === queue.ns &&
        i.usePriorityQueuing === usePriorityQueuing,
    );
  }

  protected addMessageHandler(
    handlerParams: TConsumerMessageHandlerParams,
    usePriorityQueuing: boolean,
  ): boolean {
    const { queue } = handlerParams;
    const handler = this.getMessageHandler(queue, usePriorityQueuing);
    if (handler) return false;
    this.messageHandlers.push(handlerParams);
    return true;
  }

  protected getMessageHandlerInstance = (
    queue: TQueueParams,
    usePriorityQueuing: boolean,
  ): ConsumerMessageHandler | undefined => {
    return this.messageHandlerInstances.find((i) => {
      const q = i.getQueue();
      const p = i.isUsingPriorityQueuing();
      return (
        q.name === queue.name && q.ns === queue.ns && p === usePriorityQueuing
      );
    });
  };

  protected removeMessageHandlerInstance = (
    queue: TQueueParams,
    usePriorityQueuing: boolean,
  ): void => {
    this.messageHandlerInstances = this.messageHandlerInstances.filter(
      (handler) => {
        const q = handler.getQueue();
        const p = handler.isUsingPriorityQueuing();
        return !(
          q.name === queue.name &&
          q.ns === queue.ns &&
          p === usePriorityQueuing
        );
      },
    );
  };

  protected removeMessageHandler = (
    queue: TQueueParams,
    usePriorityQueuing: boolean,
  ): void => {
    this.messageHandlers = this.messageHandlers.filter((handler) => {
      const q = handler.queue;
      return !(
        q.name === queue.name &&
        q.ns === queue.ns &&
        usePriorityQueuing === handler.usePriorityQueuing
      );
    });
  };

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
    const r = this.addMessageHandler(handlerParams, usePriorityQueuing);
    if (!r)
      cb(
        new GenericError(
          `${usePriorityQueuing ? 'Priority ' : ''}Queue [${JSON.stringify(
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

  cancel(
    queue: string | TQueueParams,
    usePriorityQueuing: boolean,
    cb: ICallback<void>,
  ): void {
    const queueParams = QueueManager.getQueueParams(queue);
    const handler = this.getMessageHandler(queueParams, usePriorityQueuing);
    if (!handler) {
      cb(
        new GenericError(
          `Message handler for ${
            usePriorityQueuing ? 'priority ' : ''
          }queue [${JSON.stringify(queueParams)}] does not exist`,
        ),
      );
    } else {
      this.removeMessageHandler(queueParams, usePriorityQueuing);
      const handlerInstance = this.getMessageHandlerInstance(
        queueParams,
        usePriorityQueuing,
      );
      if (handlerInstance) {
        handlerInstance.shutdown(() => {
          // ignoring errors
          this.removeMessageHandlerInstance(queueParams, usePriorityQueuing);
          cb();
        });
      } else cb();
    }
  }

  getRedisKeys(): TConsumerRedisKeys {
    return this.redisKeys;
  }

  getQueues(): { queue: TQueueParams; usingPriorityQueuing: boolean }[] {
    return this.messageHandlers.map((i) => ({
      queue: i.queue,
      usingPriorityQueuing: i.usePriorityQueuing,
    }));
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
