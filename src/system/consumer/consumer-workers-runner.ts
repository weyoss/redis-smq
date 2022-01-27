import { Ticker } from '../common/ticker/ticker';
import { LockManager } from '../common/lock-manager/lock-manager';
import { RedisClient } from '../common/redis-client/redis-client';
import { WorkerRunner } from '../common/worker-runner/worker-runner';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { events } from '../common/events';
import {
  ICallback,
  ICompatibleLogger,
  TConsumerWorkerParameters,
} from '../../../types';
import * as async from 'async';
import { getConfiguration } from '../common/configuration';
import { getLogger } from '../common/logger';

export class ConsumerWorkersRunner extends EventEmitter {
  protected consumerId: string;
  protected ticker: Ticker;
  protected lockManager: LockManager;
  protected workerRunner: WorkerRunner;
  protected workersDir: string;
  protected redisClient: RedisClient;
  protected workerParameters: TConsumerWorkerParameters;
  protected logger: ICompatibleLogger;

  constructor(
    consumerId: string,
    workersDir: string,
    redisClient: RedisClient,
    workerRunner: WorkerRunner,
  ) {
    super();
    this.consumerId = consumerId;
    this.workersDir = workersDir;
    this.redisClient = redisClient;
    this.workerRunner = workerRunner;
    const { keyLockConsumerWorkersRunner } = redisKeys.getMainKeys();
    this.lockManager = new LockManager(
      redisClient,
      keyLockConsumerWorkersRunner,
      10000,
      false,
    );
    this.workerParameters = {
      config: getConfiguration(),
      consumerId: this.consumerId,
    };
    this.logger = getLogger();
    this.ticker = new Ticker(this.onTick, 1000);
    this.ticker.nextTick();
  }

  protected onTick = (): void => {
    this.lockManager.acquireLock((err, locked) => {
      if (err) this.emit(events.ERROR, err);
      else if (locked) {
        if (this.workerRunner.isDown()) {
          this.workerRunner.run(
            this.workersDir,
            this.workerParameters,
            (err) => {
              if (err) this.emit(events.ERROR, err);
              else {
                this.emit(events.CONSUMER_WORKERS_STARTED);
                this.ticker.nextTick();
              }
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
    async.waterfall([stopTicker, shutdownWorkers, releaseLock], cb);
  }
}
