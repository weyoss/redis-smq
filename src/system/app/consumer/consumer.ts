import {
  ICallback,
  TConsumerMessageHandler,
  TConsumerRedisKeys,
  IConsumerWorkerParameters,
  THeartbeatRegistryPayload,
  TQueueParams,
  TUnaryFunction,
  TRedisClientMulti,
} from '../../../../types';
import { events } from '../../common/events';
import { RedisClient } from '../../common/redis-client/redis-client';
import { resolve } from 'path';
import { WorkerRunner } from '../../common/worker/worker-runner/worker-runner';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ConsumerHeartbeat } from './consumer-heartbeat';
import { Base } from '../../common/base';
import { MessageHandler } from './consumer-message-handler/message-handler';
import { consumerQueues } from './consumer-queues';
import { WorkerPool } from '../../common/worker/worker-runner/worker-pool';
import { each, waterfall } from '../../lib/async';
import { deleteConsumerAcknowledgedTimeSeries } from './consumer-time-series/consumer-acknowledged-time-series';
import { deleteConsumerDeadLetteredTimeSeries } from './consumer-time-series/consumer-dead-lettered-time-series';
import { MessageHandlerRunner } from './consumer-message-handler/message-handler-runner';
import { MultiplexedMessageHandlerRunner } from './consumer-message-handler/multiplexed-message-handler/multiplexed-message-handler-runner';

export class Consumer extends Base {
  private readonly redisKeys: TConsumerRedisKeys;
  private readonly messageHandlerRunner: MessageHandlerRunner;
  private heartbeat: ConsumerHeartbeat | null = null;
  private workerRunner: WorkerRunner<IConsumerWorkerParameters> | null = null;

  constructor(useMultiplexing = false) {
    super();
    this.messageHandlerRunner = useMultiplexing
      ? new MultiplexedMessageHandlerRunner(this)
      : new MessageHandlerRunner(this);
    this.redisKeys = redisKeys.getConsumerKeys(this.getId());
  }

  private setUpHeartbeat = (cb: ICallback<void>): void => {
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
    queue: TQueueParams,
    usePriorityQueuing: boolean,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<boolean>,
  ): void {
    this.messageHandlerRunner.addMessageHandler(
      queue,
      usePriorityQueuing,
      messageHandler,
      cb,
    );
  }

  cancel(queue: TQueueParams, cb: ICallback<void>): void {
    this.messageHandlerRunner.removeMessageHandler(queue, cb);
  }

  getQueues(): { queue: TQueueParams; usingPriorityQueuing: boolean }[] {
    return this.messageHandlerRunner.getQueues();
  }

  getRedisKeys(): TConsumerRedisKeys {
    return this.redisKeys;
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
