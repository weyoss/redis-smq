import * as async from 'neo-async';
import { Instance } from './instance';
import { TCallback, TRedisClientMulti } from '../types';
import { Message } from './message';
import { parseExpression } from 'cron-parser';
import { LockManager } from './lock-manager';
import * as Logger from 'bunyan';
import { PowerManager } from './power-manager';
import { Ticker } from './ticker';
import { RedisClient } from './redis-client';
import { events } from './events';

export class Scheduler {
  protected instance: Instance;
  protected powerManager = new PowerManager();
  protected logger: Logger;
  protected lockManagerInstance: LockManager | null = null;
  protected redisClientInstance: RedisClient | null = null;
  protected ticker: Ticker | null = null;
  protected keyLockScheduler: string;
  protected keyQueue: string;
  protected keyQueueDelayed: string;
  protected tickPeriod: number;

  constructor(instance: Instance, tickPeriod = 1000) {
    this.instance = instance;
    const { keyLockScheduler, keyQueue, keyQueueDelayed } =
      instance.getInstanceRedisKeys();
    this.keyLockScheduler = keyLockScheduler;
    this.keyQueue = keyQueue;
    this.keyQueueDelayed = keyQueueDelayed;
    this.logger = instance.getLogger();
    this.tickPeriod = tickPeriod;
  }

  protected getRedisClient(): RedisClient {
    if (!this.redisClientInstance) {
      throw new Error(`Expected an instance of RedisClient`);
    }
    return this.redisClientInstance;
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

  protected scheduleMessage(
    message: Message,
    timestamp: number,
    multi?: TRedisClientMulti,
    cb?: TCallback<number | string>,
  ): void {
    if (multi) multi.zadd(this.keyQueueDelayed, timestamp, message.toString());
    else {
      if (!cb) {
        throw new Error('Callback function is required');
      }
      this.getRedisClient().zadd(
        this.keyQueueDelayed,
        timestamp,
        message.toString(),
        cb,
      );
    }
  }

  protected scheduleNextDelivery(msg: string, multi: TRedisClientMulti): void {
    const message = Message.createFromMessage(msg);
    if (this.isPeriodic(message)) {
      const timestamp = this.getNextScheduledTimestamp(message) ?? 0;
      if (timestamp > 0) {
        const newMessage = Message.createFromMessage(message, true);
        this.scheduleMessage(newMessage, timestamp, multi);
      }
    }
  }

  protected deliverScheduledMessage(
    msg: string,
    multi: TRedisClientMulti,
    cb?: TCallback<unknown>,
  ): void {
    if (multi) {
      multi.lpush(this.keyQueue, msg);
      multi.zrem(this.keyQueueDelayed, msg);
    } else {
      if (typeof cb !== 'function') {
        throw new Error('Callback function required.');
      }
      multi = this.getRedisClient().multi();
      multi.lpush(this.keyQueue, msg);
      multi.zrem(this.keyQueueDelayed, msg);
      this.getRedisClient().execMulti(multi, cb);
    }
  }

  protected onTick(): void {
    if (this.powerManager.isRunning()) {
      this.getLockManager().acquireLock(
        this.keyLockScheduler,
        10000,
        false,
        (err, acquired) => {
          if (err) this.instance.error(err);
          else {
            if (acquired) {
              const now = Date.now();
              const process = (messages: string[], cb: TCallback<void>) => {
                if (messages.length) {
                  async.each(
                    messages,
                    (
                      msg: string,
                      _: string | number,
                      done: TCallback<unknown>,
                    ) => {
                      const multi = this.getRedisClient().multi();
                      this.deliverScheduledMessage(msg, multi);
                      this.scheduleNextDelivery(msg, multi);
                      multi.exec(done);
                    },
                    cb,
                  );
                } else cb();
              };
              const fetch = (cb: TCallback<string[]>) => {
                this.getRedisClient().zrangebyscore(
                  this.keyQueueDelayed,
                  0,
                  now,
                  (err?: Error | null, messages?: string[] | null) => {
                    if (err) cb(err);
                    else cb(null, messages);
                  },
                );
              };
              async.waterfall([fetch, process], (err) => {
                if (err) this.instance.error(err);
                else this.getTicker().nextTick();
              });
            } else this.getTicker().nextTick();
          }
        },
      );
    }
    if (this.powerManager.isGoingDown()) {
      this.instance.emit(events.SCHEDULER_READY_TO_SHUTDOWN);
    }
  }

  //@todo Modify message from outside this function
  //@todo and make getNextScheduledTimestamp() return just values
  protected getNextScheduledTimestamp(message: Message): number | null {
    if (this.isSchedulable(message)) {
      // Delay
      const msgScheduledDelay = message.getMessageScheduledDelay();
      if (msgScheduledDelay && !message.isDelayed()) {
        message.setMessageDelayed(true);
        const delayTimestamp = Date.now() + msgScheduledDelay;
        return delayTimestamp;
      }

      // CRON
      const msgScheduledCron = message.getMessageScheduledCRON();
      const cronTimestamp = msgScheduledCron
        ? parseExpression(msgScheduledCron).next().getTime()
        : 0;

      // Repeat
      const msgScheduledRepeat = message.getMessageScheduledRepeat();
      let repeatTimestamp = 0;
      if (msgScheduledRepeat) {
        const newCount = message.getMessageScheduledRepeatCount() + 1;
        if (newCount <= msgScheduledRepeat) {
          const msgScheduledPeriod = message.getMessageScheduledPeriod();
          const now = Date.now();
          if (msgScheduledPeriod) {
            repeatTimestamp = now + msgScheduledPeriod;
          } else {
            repeatTimestamp = now;
          }
        }
      }

      if (repeatTimestamp && cronTimestamp) {
        if (
          repeatTimestamp < cronTimestamp &&
          message.hasScheduledCronFired()
        ) {
          message.incrMessageScheduledRepeatCount();
          return repeatTimestamp;
        }
      }

      if (cronTimestamp) {
        // reset repeat count on each cron tick
        message.resetMessageScheduledRepeatCount();

        // if the message has also a repeat scheduling then the first time it will fires only
        // after CRON scheduling has been fired
        message.setMessageScheduledCronFired(true);

        return cronTimestamp;
      }

      if (repeatTimestamp) {
        message.incrMessageScheduledRepeatCount();
        return repeatTimestamp;
      }
    }
    return 0;
  }

  isSchedulable(message: Message): boolean {
    return (
      message.getMessageScheduledCRON() !== null ||
      message.getMessageScheduledDelay() !== null ||
      message.getMessageScheduledRepeat() > 0
    );
  }

  isPeriodic(message: Message): boolean {
    return (
      message.getMessageScheduledCRON() !== null ||
      message.getMessageScheduledRepeat() > 0
    );
  }

  schedule(
    message: Message,
    multi?: TRedisClientMulti,
    cb?: TCallback<number | string>,
  ): void {
    const timestamp = this.getNextScheduledTimestamp(message) ?? 0;
    if (timestamp > 0) {
      this.scheduleMessage(message, timestamp, multi, cb);
    }
  }

  start(): void {
    this.powerManager.goingUp();
    const config = this.instance.getConfig();
    LockManager.getInstance(config, (l: LockManager) => {
      this.lockManagerInstance = l;
      RedisClient.getInstance(config, (c) => {
        this.redisClientInstance = c;
        this.powerManager.commit();
        this.instance.emit(events.SCHEDULER_UP);
      });
    });
  }

  stop(): void {
    this.powerManager.goingDown();
    const shutdown = () => {
      this.getLockManager().quit(() => {
        this.lockManagerInstance = null;
        this.getRedisClient().end(true);
        this.redisClientInstance = null;
        this.powerManager.commit();
        this.instance.emit(events.SCHEDULER_DOWN);
      });
    };
    if (this.ticker) {
      this.instance.once(events.SCHEDULER_READY_TO_SHUTDOWN, () => {
        this.getTicker().shutdown(shutdown);
      });
    } else shutdown();
  }

  runTicker(): void {
    if (this.ticker) {
      throw new Error(`Ticker already running`);
    }
    this.ticker = new Ticker(() => {
      this.onTick();
    }, this.tickPeriod);
    this.onTick();
  }
}
