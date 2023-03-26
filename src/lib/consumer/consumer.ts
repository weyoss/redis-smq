import {
  TConsumerMessageHandler,
  TConsumerRedisKeys,
  TConsumerInfo,
  TQueueParams,
  IConfig,
  TConsumerHeartbeat,
} from '../../../types';
import { events } from '../../common/events/events';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ConsumerHeartbeat } from './consumer-heartbeat';
import { Base } from '../base';
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
  createClientInstance,
} from 'redis-smq-common';
import { ICallback, TUnaryFunction } from 'redis-smq-common/dist/types';
import DelayWorker from '../../workers/delay.worker';
import WatchdogWorker from '../../workers/watchdog.worker';
import RequeueWorker from '../../workers/requeue.worker';
import ScheduleWorker from '../../workers/schedule.worker';

export class Consumer extends Base {
  protected readonly redisKeys: TConsumerRedisKeys;
  protected readonly messageHandlerRunner: MessageHandlerRunner;
  protected heartbeat: ConsumerHeartbeat | null = null;
  protected workerRunner: WorkerRunner | null = null;

  constructor(config: IConfig = {}, useMultiplexing = false) {
    super(config);
    const nsLogger = logger.getNamespacedLogger(
      this.config.logger,
      `consumer:${this.id}:message-handler`,
    );
    this.messageHandlerRunner = useMultiplexing
      ? new MultiplexedMessageHandlerRunner(this, nsLogger)
      : new MessageHandlerRunner(this, nsLogger);
    this.redisKeys = redisKeys.getConsumerKeys(this.getId());
  }

  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    createClientInstance(this.config.redis, (err, redisClient) => {
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

  protected tearDownHeartbeat = (cb: ICallback<void>): void => {
    if (this.heartbeat) {
      this.heartbeat.quit(() => {
        this.heartbeat = null;
        cb();
      });
    } else cb();
  };

  protected setUpConsumerWorkers = (cb: ICallback<void>): void => {
    const redisClient = this.getSharedRedisClient();
    const { keyLockConsumerWorkersRunner } = this.getRedisKeys();
    const nsLogger = logger.getNamespacedLogger(
      this.config.logger,
      `consumer:${this.id}:worker-runner`,
    );
    this.workerRunner = new WorkerRunner(
      redisClient,
      keyLockConsumerWorkersRunner,
      new WorkerPool(),
      nsLogger,
    );
    this.workerRunner.on(events.ERROR, (err: Error) =>
      this.emit(events.ERROR, err),
    );
    this.workerRunner.once(events.UP, cb);
    this.workerRunner.addWorker(new DelayWorker(redisClient, true));
    this.workerRunner.addWorker(
      new WatchdogWorker(redisClient, this.config, true, this.logger),
    );
    this.workerRunner.addWorker(new RequeueWorker(redisClient, true));
    this.workerRunner.addWorker(new ScheduleWorker(redisClient, true));
    this.workerRunner.run();
  };

  protected initConsumerEventListeners = (cb: ICallback<void>): void => {
    this.registerEventListeners(
      this.config.eventListeners.consumerEventListeners,
      cb,
    );
  };

  protected tearDownConsumerWorkers = (cb: ICallback<void>): void => {
    if (this.workerRunner) {
      this.workerRunner.quit(() => {
        this.workerRunner = null;
        cb();
      });
    } else cb();
  };

  protected runMessageHandlers = (cb: ICallback<void>): void => {
    const redisClient = this.getSharedRedisClient();
    this.messageHandlerRunner.run(redisClient, cb);
  };

  protected shutdownMessageHandlers = (cb: ICallback<void>): void => {
    if (this.messageHandlerRunner) {
      this.messageHandlerRunner.shutdown(cb);
    } else cb();
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super
      .goingUp()
      .concat([
        this.setUpHeartbeat,
        this.initConsumerEventListeners,
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
    const queueParams = Queue.getParams(this.config, queue);
    this.messageHandlerRunner.addMessageHandler(
      queueParams,
      messageHandler,
      cb,
    );
  }

  cancel(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(this.config, queue);
    this.messageHandlerRunner.removeMessageHandler(queueParams, cb);
  }

  getQueues(): TQueueParams[] {
    return this.messageHandlerRunner.getQueues();
  }

  getRedisKeys(): TConsumerRedisKeys {
    return this.redisKeys;
  }

  static getConsumersHeartbeats(
    redisClient: RedisClient,
    consumersIds: string[],
    cb: ICallback<Record<string, TConsumerHeartbeat | false>>,
  ): void {
    ConsumerHeartbeat.getConsumersHeartbeats(redisClient, consumersIds, cb);
  }

  static getConsumerHeartbeat(
    redisClient: RedisClient,
    consumerId: string,
    cb: ICallback<TConsumerHeartbeat | false>,
  ): void {
    ConsumerHeartbeat.getConsumersHeartbeats(
      redisClient,
      [consumerId],
      (err, consumersHeartbeats = {}) => {
        if (err) cb(err);
        else cb(null, consumersHeartbeats[consumerId]);
      },
    );
  }

  static getQueueConsumers(
    redisClient: RedisClient,
    queue: TQueueParams,
    transform = false,
    cb: ICallback<Record<string, TConsumerInfo | string>>,
  ): void {
    consumerQueues.getQueueConsumers(redisClient, queue, transform, cb);
  }

  static getQueueConsumerIds(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<string[]>,
  ): void {
    consumerQueues.getQueueConsumerIds(redisClient, queue, cb);
  }

  static countQueueConsumers(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    consumerQueues.countQueueConsumers(redisClient, queue, cb);
  }
}
