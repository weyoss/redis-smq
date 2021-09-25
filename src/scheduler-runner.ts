import { IConfig } from '../types';
import { LockManager } from './lock-manager';
import * as BLogger from 'bunyan';
import { PowerManager } from './power-manager';
import { Ticker } from './ticker';
import { events } from './events';
import { EventEmitter } from 'events';
import { redisKeys } from './redis-keys';
import { Logger } from './logger';
import { Scheduler } from './scheduler';
import { RedisClient } from './redis-client';

export class SchedulerRunner extends EventEmitter {
  protected powerManager: PowerManager;
  protected logger: BLogger;
  protected keyLockScheduler: string;
  protected config: IConfig;
  protected tickPeriod: number;
  protected queueName: string;
  protected schedulerInstance: Scheduler | null = null;
  protected ticker: Ticker | null = null;
  protected lockManagerInstance: LockManager | null = null;

  constructor(queueName: string, config: IConfig = {}, tickPeriod = 1000) {
    super();
    this.queueName = queueName;
    this.config = config;
    const { keyLockScheduler } = redisKeys.getKeys(queueName);
    this.keyLockScheduler = keyLockScheduler;
    this.logger = Logger('scheduler', config.log);
    this.tickPeriod = tickPeriod;
    this.powerManager = new PowerManager();
  }

  protected getLockManager(): LockManager {
    if (!this.lockManagerInstance) {
      throw new Error(`Expected an instance of LockManager`);
    }
    return this.lockManagerInstance;
  }

  protected getTicker(): Ticker {
    if (!this.ticker) {
      throw new Error(`Expected an instance of Ticker`);
    }
    return this.ticker;
  }

  protected debug(message: string): void {
    this.logger.debug({ scheduler: true }, message);
  }

  protected getScheduler(): Scheduler {
    if (!this.schedulerInstance) {
      throw new Error(`Expected an instance of Scheduler`);
    }
    return this.schedulerInstance;
  }

  protected onTick(): void {
    if (this.powerManager.isRunning()) {
      this.getLockManager().acquireLock(
        this.keyLockScheduler,
        10000,
        false,
        (err, acquired) => {
          if (err) throw err;
          else {
            if (acquired) {
              this.getScheduler().enqueueMessages(() => {
                this.getTicker().nextTick();
              });
            } else this.getTicker().nextTick();
          }
        },
      );
    }
    if (this.powerManager.isGoingDown()) {
      this.emit(events.SCHEDULER_RUNNER_READY_TO_SHUTDOWN);
    }
  }

  start(scheduler: Scheduler): void {
    this.powerManager.goingUp();
    this.lockManagerInstance = new LockManager(new RedisClient(this.config));
    this.schedulerInstance = scheduler;
    this.powerManager.commit();
    this.ticker = new Ticker(() => {
      this.onTick();
    }, this.tickPeriod);
    this.onTick();
    this.emit(events.SCHEDULER_RUNNER_UP);
  }

  stop(): void {
    this.powerManager.goingDown();
    this.once(events.SCHEDULER_RUNNER_READY_TO_SHUTDOWN, () => {
      this.getTicker().shutdown(() => {
        this.getLockManager().quit(() => {
          this.lockManagerInstance = null;
          this.getScheduler().quit();
          this.schedulerInstance = null;
          this.powerManager.commit();
          this.emit(events.SCHEDULER_RUNNER_DOWN);
        });
      });
    });
  }
}
