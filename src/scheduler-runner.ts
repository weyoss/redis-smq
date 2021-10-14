import { ICallback, IConfig } from '../types';
import { LockManager } from './lock-manager';
import * as BLogger from 'bunyan';
import { Ticker } from './ticker';
import { events } from './events';
import { Logger } from './logger';
import { Scheduler } from './scheduler';
import { Consumer } from './consumer';
import { EventEmitter } from 'events';
import { RedisClient } from './redis-client';

export class SchedulerRunner extends EventEmitter {
  protected consumer: Consumer;
  protected logger: BLogger;
  protected keyLockScheduler: string;
  protected config: IConfig;
  protected tickPeriod: number;
  protected queueName: string;
  protected consumerId: string;
  protected schedulerInstance: Scheduler;
  protected ticker: Ticker;
  protected lockManagerInstance: LockManager;

  constructor(consumer: Consumer, redisClient: RedisClient, tickPeriod = 1000) {
    super();
    this.consumer = consumer;
    this.schedulerInstance = new Scheduler(
      consumer.getQueueName(),
      redisClient,
    );
    this.lockManagerInstance = new LockManager(redisClient);
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
    this.ticker = new Ticker(() => {
      this.onTick();
    }, this.tickPeriod);
    this.ticker.nextTick();
  }

  protected debug(message: string): void {
    this.logger.debug({ scheduler: true }, message);
  }

  protected onTick(): void {
    this.lockManagerInstance.acquireLock(
      this.keyLockScheduler,
      10000,
      false,
      (err, acquired) => {
        if (err) this.consumer.emit(events.ERROR, err);
        else {
          if (acquired) {
            this.consumer.getBroker((broker) => {
              this.schedulerInstance.enqueueScheduledMessages(broker, (err) => {
                if (err) this.consumer.emit(events.ERROR, err);
                else this.ticker.nextTick();
              });
            });
          } else this.ticker.nextTick();
        }
      },
    );
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, () => {
      this.lockManagerInstance.quit(cb);
    });
    this.ticker.quit();
  }
}
