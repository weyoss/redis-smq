import { Ticker } from '../common/ticker/ticker';
import { LockManager } from '../common/lock-manager/lock-manager';
import { RedisClient } from '../common/redis-client/redis-client';
import { WorkerRunner } from '../common/worker-runner/worker-runner';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { events } from '../common/events';
import { ICallback, IConfig, TConsumerWorkerParameters } from '../../../types';
import * as async from 'async';
import BLogger from 'bunyan';

export class ConsumerWorkers extends EventEmitter {
  protected consumerId: string;
  protected ticker: Ticker;
  protected config: IConfig;
  protected lockManager: LockManager;
  protected workerRunner: WorkerRunner;
  protected workersDir: string;
  protected redisClient: RedisClient;
  protected logger: BLogger;
  protected workerParameters: TConsumerWorkerParameters;

  constructor(
    consumerId: string,
    workersDir: string,
    config: IConfig,
    redisClient: RedisClient,
    workerRunner: WorkerRunner,
    logger: BLogger,
  ) {
    super();
    this.consumerId = consumerId;
    this.workersDir = workersDir;
    this.config = config;
    this.redisClient = redisClient;
    this.workerRunner = workerRunner;
    this.logger = logger.child({
      child: ConsumerWorkers.name,
    });
    const { keyLockConsumerWorkersRunner } = redisKeys.getMainKeys();
    this.lockManager = new LockManager(
      redisClient,
      keyLockConsumerWorkersRunner,
      10000,
      false,
    );
    this.workerParameters = {
      config: this.config,
      consumerId: this.consumerId,
    };
    this.ticker = new Ticker(this.onTick, 1000);
    this.ticker.nextTick();
  }

  protected onTick = (): void => {
    this.lockManager.acquireLock((err, locked) => {
      if (err) this.emit(events.ERROR, err);
      else if (locked) {
        if (this.workerRunner.isDown()) {
          this.logger.debug(`Starting consumer workers threads...`);
          this.workerRunner.run(
            this.workersDir,
            this.workerParameters,
            (err) => {
              if (err) this.emit(events.ERROR, err);
              else this.ticker.nextTick();
            },
          );
        } else this.ticker.nextTick();
      } else this.ticker.nextTick();
    });
  };

  quit(cb: ICallback<void>): void {
    const stopTicker = (cb: ICallback<void>) => {
      this.ticker.once(events.DOWN, cb);
      this.ticker.quit();
    };
    const shutdownWorkers = (cb: ICallback<void>) =>
      this.workerRunner.shutdown(cb);
    const releaseLock = (cb: ICallback<void>) => this.lockManager.quit(cb);
    this.logger.debug(`Tearing down consumer workers threads...`);
    async.waterfall([stopTicker, shutdownWorkers, releaseLock], cb);
  }
}
