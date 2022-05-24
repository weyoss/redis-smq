import {
  TConsumerMessageHandler,
  TConsumerRedisKeys,
  IConsumerWorkerParameters,
  TConsumerInfo,
  TQueueParams,
} from '../../../types';
import { events } from '../../common/events/events';
import { resolve } from 'path';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ConsumerHeartbeat } from './consumer-heartbeat';
import { Base } from '../base';
import { MessageHandler } from './consumer-message-handler/message-handler';
import { consumerQueues } from './consumer-queues';
import { MessageHandlerRunner } from './consumer-message-handler/message-handler-runner';
import { MultiplexedMessageHandlerRunner } from './consumer-message-handler/multiplexed-message-handler/multiplexed-message-handler-runner';
import { Queue } from '../queue-manager/queue';
import {
  errors,
  RedisClient,
  WorkerRunner,
  WorkerPool,
  logger,
  async,
} from 'redis-smq-common';
import { getConfiguration } from '../../config/configuration';
import {
  ICallback,
  TRedisClientMulti,
  TUnaryFunction,
} from 'redis-smq-common/dist/types';

export class Consumer extends Base {
  private readonly redisKeys: TConsumerRedisKeys;
  private readonly messageHandlerRunner: MessageHandlerRunner;
  private heartbeat: ConsumerHeartbeat | null = null;
  private workerRunner: WorkerRunner<IConsumerWorkerParameters> | null = null;

  constructor(useMultiplexing = false) {
    super();
    const { logger: loggerCfg } = getConfiguration();
    const nsLogger = logger.getNamespacedLogger(
      loggerCfg,
      `consumer:${this.id}:message-handler`,
    );
    this.messageHandlerRunner = useMultiplexing
      ? new MultiplexedMessageHandlerRunner(this, nsLogger)
      : new MessageHandlerRunner(this, nsLogger);
    this.redisKeys = redisKeys.getConsumerKeys(this.getId());
  }

  private setUpHeartbeat = (cb: ICallback<void>): void => {
    const { redis } = getConfiguration();
    RedisClient.getNewInstance(redis, (err, redisClient) => {
      if (err) cb(err);
      else if (!redisClient) cb(new errors.EmptyCallbackReplyError());
      else {
        this.heartbeat = new ConsumerHeartbeat(this, redisClient);
        this.heartbeat.on(events.ERROR, (err: Error) =>
          this.emit(events.ERROR, err),
        );
        this.heartbeat.once(events.TICK, () => cb());
      }
    });
  };

  private tearDownHeartbeat = (cb: ICallback<void>): void => {
    if (this.heartbeat) {
      this.heartbeat.quit(() => {
        this.heartbeat = null;
        cb();
      });
    } else cb();
  };

  private setUpConsumerWorkers = (cb: ICallback<void>): void => {
    const redisClient = this.getSharedRedisClient();
    const { keyLockConsumerWorkersRunner } = this.getRedisKeys();
    const { logger: loggerCfg } = getConfiguration();
    const nsLogger = logger.getNamespacedLogger(
      loggerCfg,
      `consumer:${this.id}:worker-runner`,
    );
    this.workerRunner = new WorkerRunner<IConsumerWorkerParameters>(
      redisClient,
      resolve(`${__dirname}/../../workers`),
      keyLockConsumerWorkersRunner,
      {
        consumerId: this.id,
        timeout: 1000,
        config: this.getConfig(),
      },
      new WorkerPool(),
      nsLogger,
    );
    this.workerRunner.on(events.ERROR, (err: Error) =>
      this.emit(events.ERROR, err),
    );
    this.workerRunner.once(events.UP, cb);
    this.workerRunner.run();
  };

  private tearDownConsumerWorkers = (cb: ICallback<void>): void => {
    if (this.workerRunner) {
      this.workerRunner.quit(() => {
        this.workerRunner = null;
        cb();
      });
    } else cb();
  };

  private runMessageHandlers = (cb: ICallback<void>): void => {
    const redisClient = this.getSharedRedisClient();
    this.messageHandlerRunner.run(redisClient, cb);
  };

  private shutdownMessageHandlers = (cb: ICallback<void>): void => {
    if (this.messageHandlerRunner) {
      this.messageHandlerRunner.shutdown(cb);
    } else cb();
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super
      .goingUp()
      .concat([
        this.setUpHeartbeat,
        this.runMessageHandlers,
        this.setUpConsumerWorkers,
      ]);
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [
      this.tearDownConsumerWorkers,
      this.shutdownMessageHandlers,
      this.tearDownHeartbeat,
    ].concat(super.goingDown());
  }

  consume(
    queue: string | TQueueParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(queue);
    this.messageHandlerRunner.addMessageHandler(
      queueParams,
      messageHandler,
      cb,
    );
  }

  cancel(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(queue);
    this.messageHandlerRunner.removeMessageHandler(queueParams, cb);
  }

  getQueues(): TQueueParams[] {
    return this.messageHandlerRunner.getQueues();
  }

  getRedisKeys(): TConsumerRedisKeys {
    return this.redisKeys;
  }

  static getOnlineConsumers(
    redisClient: RedisClient,
    queue: TQueueParams,
    transform = false,
    cb: ICallback<Record<string, TConsumerInfo | string>>,
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
    async.waterfall(
      [
        (cb: ICallback<TQueueParams[]>) =>
          consumerQueues.getConsumerQueues(redisClient, consumerId, cb),
        (queues: TQueueParams[], cb: ICallback<void>) => {
          async.each(
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
