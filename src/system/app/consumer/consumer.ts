import {
  ICallback,
  TConsumerMessageHandler,
  TConsumerMessageHandlerParams,
  TConsumerRedisKeys,
  IConsumerWorkerParameters,
  THeartbeatRegistryPayload,
  TQueueParams,
  TUnaryFunction,
} from '../../../../types';
import { ConsumerMessageRate } from './consumer-message-rate';
import { events } from '../../common/events';
import { RedisClient } from '../../common/redis-client/redis-client';
import { resolve } from 'path';
import { WorkerRunner } from '../../common/worker/worker-runner/worker-runner';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ConsumerHeartbeat } from './consumer-heartbeat';
import { ConsumerMessageRateWriter } from './consumer-message-rate-writer';
import { Base } from '../../common/base';
import { ConsumerMessageHandler } from './consumer-message-handler';
import { consumerQueues } from './consumer-queues';
import { GenericError } from '../../common/errors/generic.error';
import { queueManager } from '../queue-manager/queue-manager';
import { WorkerPool } from '../../common/worker/worker-runner/worker-pool';
import { each } from '../../lib/async';

export class Consumer extends Base {
  private heartbeat: ConsumerHeartbeat | null = null;
  private workerRunner: WorkerRunner<IConsumerWorkerParameters> | null = null;
  private messageHandlerInstances: ConsumerMessageHandler[] = [];
  private messageHandlers: TConsumerMessageHandlerParams[] = [];
  private readonly redisKeys: TConsumerRedisKeys;

  constructor() {
    super();
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
    RedisClient.getNewInstance((err, redisClient) => {
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
    if (this.heartbeat) {
      this.heartbeat.quit(() => {
        this.heartbeat = null;
        cb();
      });
    } else cb();
  };

  protected setUpConsumerWorkers = (cb: ICallback<void>): void => {
    this.getSharedRedisClient((client) => {
      const { keyLockConsumerWorkersRunner } = this.getRedisKeys();
      this.workerRunner = new WorkerRunner<IConsumerWorkerParameters>(
        client,
        resolve(`${__dirname}/../../workers`),
        keyLockConsumerWorkersRunner,
        {
          consumerId: this.id,
          timeout: 1000,
          config: this.getConfig(),
        },
        new WorkerPool(),
      );
      this.workerRunner.on(events.ERROR, (err: Error) =>
        this.emit(events.ERROR, err),
      );
      this.workerRunner.on(events.WORKER_RUNNER_WORKERS_STARTED, () =>
        this.logger.info(
          `Workers are exclusively running from this consumer instance.`,
        ),
      );
      this.workerRunner.run();
      cb();
    });
  };

  protected tearDownConsumerWorkers = (cb: ICallback<void>): void => {
    if (this.workerRunner) {
      this.workerRunner.quit(() => {
        this.workerRunner = null;
        cb();
      });
    } else cb();
  };

  protected runMessageHandler = (
    handlerParams: TConsumerMessageHandlerParams,
    cb: ICallback<void>,
  ): void => {
    RedisClient.getNewInstance((err, redisClient) => {
      if (err) cb(err);
      else if (!redisClient) cb(new EmptyCallbackReplyError());
      else {
        this.getSharedRedisClient((sharedRedisClient) => {
          const { queue, usePriorityQueuing, messageHandler } = handlerParams;
          const messageRate = this.getConfig().monitor.enabled
            ? this.createMessageRateInstance(queue, sharedRedisClient)
            : null;
          const handler = new ConsumerMessageHandler(
            this.id,
            queue,
            messageHandler,
            usePriorityQueuing,
            this.getConfig().storeMessages,
            redisClient,
            messageRate,
          );
          this.registerMessageHandlerEvents(handler);
          this.messageHandlerInstances.push(handler);
          this.logger.info(
            `Created a new instance (ID: ${handler.getId()}) for MessageHandler (${JSON.stringify(
              handlerParams,
            )}).`,
          );
          handler.run(cb);
        });
      }
    });
  };

  protected consumeMessages = (cb: ICallback<void>): void => {
    each(
      this.messageHandlers,
      (handlerParams, _, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      cb,
    );
  };

  protected tearDownMessageHandlerInstances = (cb: ICallback<void>): void => {
    each(
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

  protected createMessageRateInstance = (
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

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super
      .goingUp()
      .concat([
        this.setUpHeartbeat,
        this.consumeMessages,
        this.setUpConsumerWorkers,
      ]);
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
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
    this.logger.info(
      `Message handler with parameters (${JSON.stringify(
        handlerParams,
      )}) has been registered.`,
    );
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
    this.logger.info(
      `Message handler with parameters (${JSON.stringify(
        queue,
      )}) has been canceled.`,
    );
  };

  consume(
    queue: string | TQueueParams,
    usePriorityQueuing: boolean,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = queueManager.getQueueParams(queue);
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
    const queueParams = queueManager.getQueueParams(queue);
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
    const { keyQueueConsumers } = redisKeys.getQueueConsumerKeys(queue, id);
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
