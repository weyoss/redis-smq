import { Ticker } from '../common/ticker';
import { LockManager } from '../common/lock-manager';
import { RedisClient } from '../redis-client/redis-client';
import { WorkerRunner } from '../common/worker-runner';
import { redisKeys } from '../common/redis-keys';
import { EventEmitter } from 'events';
import { events } from '../common/events';
import { ICallback, IConfig } from '../../../types';

export class ConsumerWorkers extends EventEmitter {
  protected ticker: Ticker;
  protected config: IConfig;
  protected lockerManager: LockManager;
  protected workerRunner: WorkerRunner;
  protected workersDir: string;

  constructor(
    workersDir: string,
    config: IConfig,
    redisClient: RedisClient,
    workerRunner: WorkerRunner,
  ) {
    super();
    this.workersDir = workersDir;
    this.config = config;
    this.workerRunner = workerRunner;
    const { keyLockWorkersRunnerConsumer } = redisKeys.getGlobalKeys();
    this.lockerManager = new LockManager(
      redisClient,
      keyLockWorkersRunnerConsumer,
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
    this.ticker.once(events.DOWN, () => {
      if (this.lockerManager.isLocked()) {
        this.workerRunner.shutdown(() => this.lockerManager.quit(cb));
      } else this.lockerManager.quit(cb);
    });
    this.ticker.quit();
  }
}
