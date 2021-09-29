import { IConfig, TUnaryFunction } from '../types';
import { LockManager } from './lock-manager';
import * as BLogger from 'bunyan';
import { PowerManager } from './power-manager';
import { Ticker } from './ticker';
import { events } from './events';
import { Logger } from './logger';
import { Scheduler } from './scheduler';
import { RedisClient } from './redis-client';
import { Consumer } from './consumer';

export class SchedulerRunner {
  protected consumer: Consumer;
  protected powerManager: PowerManager;
  protected logger: BLogger;
  protected keyLockScheduler: string;
  protected config: IConfig;
  protected tickPeriod: number;
  protected queueName: string;
  protected consumerId: string;
  protected schedulerInstance: Scheduler | null = null;
  protected ticker: Ticker | null = null;
  protected lockManagerInstance: LockManager | null = null;

  constructor(consumer: Consumer, tickPeriod = 1000) {
    this.consumer = consumer;
    this.queueName = consumer.getQueueName();
    this.config = consumer.getConfig();
    this.consumerId = consumer.getId();
    const { keyLockScheduler } = consumer.getInstanceRedisKeys();
    this.keyLockScheduler = keyLockScheduler;
    this.logger = Logger(
      `scheduler (${this.queueName}/${this.consumerId})`,
      this.config.log,
    );
    this.tickPeriod = tickPeriod;
    this.powerManager = new PowerManager();
  }

  protected getLockManager(cb: TUnaryFunction<LockManager>): void {
    if (!this.lockManagerInstance)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of LockManager`),
      );
    else cb(this.lockManagerInstance);
  }

  protected getTicker(cb: TUnaryFunction<Ticker>): void {
    if (!this.ticker)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of Ticker`),
      );
    else cb(this.ticker);
  }

  protected debug(message: string): void {
    this.logger.debug({ scheduler: true }, message);
  }

  protected getScheduler(cb: TUnaryFunction<Scheduler>): void {
    if (!this.schedulerInstance)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of Scheduler`),
      );
    else cb(this.schedulerInstance);
  }

  protected onTick(): void {
    if (this.powerManager.isRunning()) {
      this.getLockManager((lockerManager) => {
        lockerManager.acquireLock(
          this.keyLockScheduler,
          10000,
          false,
          (err, acquired) => {
            if (err) this.consumer.emit(events.ERROR, err);
            else {
              this.getTicker((ticker) => {
                if (acquired) {
                  this.getScheduler((scheduler) => {
                    scheduler.enqueueScheduledMessages((err) => {
                      if (err) this.consumer.emit(events.ERROR, err);
                      else ticker.nextTick();
                    });
                  });
                } else ticker.nextTick();
              });
            }
          },
        );
      });
    }
    if (this.powerManager.isGoingDown()) {
      this.consumer.emit(events.SCHEDULER_RUNNER_READY_TO_SHUTDOWN);
    }
  }

  protected setupTicker() {
    this.ticker = new Ticker(() => {
      this.onTick();
    }, this.tickPeriod);
    this.ticker.on(events.ERROR, (err: Error) =>
      this.consumer.emit(events.ERROR, err),
    );
  }

  start(): void {
    this.powerManager.goingUp();
    RedisClient.getInstance(this.config, (client) => {
      this.lockManagerInstance = new LockManager(client);
      this.schedulerInstance = new Scheduler(this.queueName, client);
      this.powerManager.commit();
      this.setupTicker();
      this.onTick();
      this.consumer.emit(events.SCHEDULER_RUNNER_UP);
    });
  }

  stop(): void {
    this.powerManager.goingDown();
    this.consumer.once(events.SCHEDULER_RUNNER_READY_TO_SHUTDOWN, () => {
      this.getTicker((ticker) => {
        ticker.shutdown();
        this.getLockManager((lockManager) => {
          lockManager.quit(() => {
            this.lockManagerInstance = null;
            this.schedulerInstance = null;
            this.powerManager.commit();
            this.consumer.emit(events.SCHEDULER_RUNNER_DOWN);
          });
        });
      });
    });
  }
}
