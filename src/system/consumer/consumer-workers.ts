import { Ticker } from '../common/ticker';
import { LockManager } from '../common/lock-manager';
import { RedisClient } from '../redis-client/redis-client';
import { WorkerRunner } from '../common/worker-runner';
import { redisKeys } from '../common/redis-keys';
import { EventEmitter } from 'events';
import { events } from '../common/events';
import { ICallback, IConfig } from '../../../types';
import * as async from 'async';

export class ConsumerWorkers extends EventEmitter {
  protected ticker: Ticker;
  protected config: IConfig;
  protected lockerManager: LockManager;
  protected workerRunner: WorkerRunner;
  protected workersDir: string;
  protected redisClient: RedisClient;

  constructor(
    workersDir: string,
    config: IConfig,
    redisClient: RedisClient,
    workerRunner: WorkerRunner,
  ) {
    super();
    this.workersDir = workersDir;
    this.config = config;
    this.redisClient = redisClient;
    this.workerRunner = workerRunner;
    const { keyLockConsumerWorkersRunner } = redisKeys.getGlobalKeys();
    this.lockerManager = new LockManager(
      redisClient,
      keyLockConsumerWorkersRunner,
      10000,
      false,
    );
    this.ticker = new Ticker(this.onTick, 1000);
    this.ticker.nextTick();
  }

  protected onTick = (): void => {
    this.lockerManager.acquireLock((err, locked) => {
      if (err) this.emit(events.ERROR, err);
      else if (locked) {
        if (!this.workerRunner.isRunning()) {
          this.workerRunner.run(this.config, this.workersDir, (err) => {
            if (err) this.emit(events.ERROR, err);
            else this.ticker.nextTick();
          });
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
    const releaseLock = (cb: ICallback<void>) => this.lockerManager.quit(cb);
    async.waterfall([stopTicker, shutdownWorkers, releaseLock], cb);
  }
}
