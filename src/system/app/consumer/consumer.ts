import {
  ICallback,
  TConsumerMessageHandler,
  TConsumerMessageHandlerParams,
  TConsumerRedisKeys,
  IConsumerWorkerParameters,
  THeartbeatRegistryPayload,
  TQueueParams,
  TUnaryFunction,
  TRedisClientMulti,
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
import { MessageHandler } from './consumer-message-handler/message-handler';
import { consumerQueues } from './consumer-queues';
import { queueManager } from '../queue-manager/queue-manager';
import { WorkerPool } from '../../common/worker/worker-runner/worker-pool';
import { each, waterfall } from '../../lib/async';
import { deleteConsumerAcknowledgedTimeSeries } from './consumer-time-series/consumer-acknowledged-time-series';
import { deleteConsumerDeadLetteredTimeSeries } from './consumer-time-series/consumer-dead-lettered-time-series';
import { MessageHandlerAlreadyExistsError } from './errors/message-handler-already-exists.error';

export class Consumer extends Base {
  private heartbeat: ConsumerHeartbeat | null = null;
  private workerRunner: WorkerRunner<IConsumerWorkerParameters> | null = null;
  private messageHandlerInstances: MessageHandler[] = [];
  private messageHandlers: TConsumerMessageHandlerParams[] = [];
  private readonly redisKeys: TConsumerRedisKeys;

  constructor() {
    super();
    this.redisKeys = redisKeys.getConsumerKeys(this.getId());
  }

  protected registerMessageHandlerEvents = (
    messageHandler: MessageHandler,
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
          const handler = new MessageHandler(
            this.id,
            queue,
            messageHandler,
            usePriorityQueuing,
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
    this.getSharedRedisClient((client: RedisClient) => {
      each(
        this.messageHandlerInstances,
        (handler, queue, done) => {
          handler.shutdown(client, done);
        },
        (err) => {
          if (err) cb(err);
          else {
            this.messageHandlerInstances = [];
            cb();
          }
        },
      );
    });
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
  ): TConsumerMessageHandlerParams | undefined {
    return this.messageHandlers.find(
      (i) => i.queue.name === queue.name && i.queue.ns === queue.ns,
    );
  }

  protected addMessageHandler(
    handlerParams: TConsumerMessageHandlerParams,
  ): boolean {
    const { queue } = handlerParams;
    const handler = this.getMessageHandler(queue);
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
  ): MessageHandler | undefined => {
    return this.messageHandlerInstances.find((i) => {
      const q = i.getQueue();
      return q.name === queue.name && q.ns === queue.ns;
    });
  };

  protected removeMessageHandlerInstance = (queue: TQueueParams): void => {
    this.messageHandlerInstances = this.messageHandlerInstances.filter(
      (handler) => {
        const q = handler.getQueue();
        return !(q.name === queue.name && q.ns === queue.ns);
      },
    );
  };

  protected removeMessageHandler = (queue: TQueueParams): void => {
    this.messageHandlers = this.messageHandlers.filter((handler) => {
      const q = handler.queue;
      return !(q.name === queue.name && q.ns === queue.ns);
    });
    this.logger.info(
      `Message handler with parameters (${JSON.stringify(
        queue,
      )}) has been canceled.`,
    );
  };

  consume(
    queue: TQueueParams,
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
    const r = this.addMessageHandler(handlerParams);
    if (!r) cb(new MessageHandlerAlreadyExistsError(queueParams));
    else {
      if (this.isRunning())
        this.runMessageHandler(handlerParams, (err) => {
          if (err) cb(err);
          else cb(null, true);
        });
      else cb(null, false);
    }
  }

  cancel(queue: TQueueParams, cb: ICallback<void>): void {
    const handler = this.getMessageHandler(queue);
    if (!handler) cb();
    else {
      this.removeMessageHandler(queue);
      const handlerInstance = this.getMessageHandlerInstance(queue);
      if (handlerInstance) {
        this.getSharedRedisClient((client) => {
          handlerInstance.shutdown(client, () => {
            // ignoring errors
            this.removeMessageHandlerInstance(queue);
            cb();
          });
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

  static handleOfflineConsumer(
    multi: TRedisClientMulti, // pending transaction
    redisClient: RedisClient, // for readonly operations
    consumerId: string,
    cb: ICallback<void>,
  ): void {
    deleteConsumerAcknowledgedTimeSeries(multi, consumerId);
    deleteConsumerDeadLetteredTimeSeries(multi, consumerId);
    waterfall(
      [
        (cb: ICallback<TQueueParams[]>) =>
          consumerQueues.getConsumerQueues(redisClient, consumerId, cb),
        (queues: TQueueParams[], cb: ICallback<void>) => {
          each(
            queues,
            (queue, _, done) => {
              MessageHandler.cleanUp(
                redisClient,
                consumerId,
                queue,
                multi,
                done,
              );
            },
            cb,
          );
        },
      ],
      cb,
    );
  }
}
