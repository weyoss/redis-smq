import {
  TConsumerMessageHandler,
  TConsumerRedisKeys,
  IQueueParams,
} from '../../../types';
import { events } from '../../common/events/events';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ConsumerHeartbeat } from './consumer-heartbeat';
import { Base } from '../base';
import { MessageHandlerRunner } from './message-handler/message-handler-runner';
import { MultiplexedMessageHandlerRunner } from './multiplexed-message-handler/multiplexed-message-handler-runner';
import {
  WorkerRunner,
  WorkerPool,
  logger,
  redis,
  ICallback,
  TUnaryFunction,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import DelayUnacknowledgedWorker from '../../workers/delay-unacknowledged.worker';
import WatchConsumersWorker from '../../workers/watch-consumers.worker';
import RequeueUnacknowledgedWorker from '../../workers/requeue-unacknowledged.worker';
import PublishScheduledWorker from '../../workers/publish-scheduled.worker';
import { _getQueueParams } from '../queue/queue/_get-queue-params';
import { Configuration } from '../../config/configuration';

export class Consumer extends Base {
  protected readonly redisKeys: TConsumerRedisKeys;
  protected readonly messageHandlerRunner: MessageHandlerRunner;
  protected heartbeat: ConsumerHeartbeat | null = null;
  protected workerRunner: WorkerRunner | null = null;

  constructor(useMultiplexing = false) {
    super();
    const nsLogger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `consumer:${this.id}:message-handler`,
    );
    this.messageHandlerRunner = useMultiplexing
      ? new MultiplexedMessageHandlerRunner(this, nsLogger)
      : new MessageHandlerRunner(this, nsLogger);
    this.redisKeys = redisKeys.getConsumerKeys(this.getId());
  }

  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    redis.createInstance(
      Configuration.getSetConfig().redis,
      (err, redisClient) => {
        if (err) cb(err);
        else if (!redisClient) cb(new CallbackEmptyReplyError());
        else {
          this.heartbeat = new ConsumerHeartbeat(
            redisClient,
            this,
            this.redisKeys,
          );
          this.heartbeat.on(events.ERROR, (err: Error) =>
            this.emit(events.ERROR, err),
          );
          this.heartbeat.once(events.TICK, () => cb());
        }
      },
    );
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
    const { keyLockConsumerWorkersRunner } = this.redisKeys;
    const nsLogger = logger.getLogger(
      Configuration.getSetConfig().logger,
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
    this.workerRunner.addWorker(
      new DelayUnacknowledgedWorker(redisClient, true),
    );
    this.workerRunner.addWorker(
      new WatchConsumersWorker(redisClient, true, this.logger),
    );
    this.workerRunner.addWorker(
      new RequeueUnacknowledgedWorker(redisClient, true),
    );
    this.workerRunner.addWorker(new PublishScheduledWorker(redisClient, true));
    this.workerRunner.run();
  };

  protected initConsumerEventListeners = (cb: ICallback<void>): void => {
    this.registerEventListeners(
      Configuration.getSetConfig().eventListeners.consumerEventListeners,
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
    queue: string | IQueueParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const queueParams = _getQueueParams(queue);
    this.messageHandlerRunner.addMessageHandler(
      queueParams,
      messageHandler,
      cb,
    );
  }

  cancel(queue: string | IQueueParams, cb: ICallback<void>): void {
    const queueParams = _getQueueParams(queue);
    this.messageHandlerRunner.removeMessageHandler(queueParams, cb);
  }

  getQueues(): IQueueParams[] {
    return this.messageHandlerRunner.getQueues();
  }
}
