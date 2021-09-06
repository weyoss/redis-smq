import * as async from 'neo-async';
import { Instance } from './instance';
import { TCallback, TCompatibleRedisClient } from '../types';
import { Message } from './message';
import { parseExpression } from 'cron-parser';
import { LockManager } from './lock-manager';
import * as Logger from 'bunyan';
import { PowerManager } from './power-manager';
import { Ticker } from './ticker';
import { Multi } from 'redis';
import { RedisClient } from './redis-client';
import { events } from './events';

export class Scheduler {
  protected instance: Instance;
  protected powerManager = new PowerManager();
  protected logger: Logger;
  protected lockManagerInstance: LockManager | null = null;
  protected redisClientInstance: TCompatibleRedisClient | null = null;
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

  protected getRedisClient(): TCompatibleRedisClient {
    if (!this.redisClientInstance) {
      throw new Error();
    }
    return this.redisClientInstance;
  }

  protected getLockManager(): LockManager {
    if (!this.lockManagerInstance) {
      throw new Error();
    }
    return this.lockManagerInstance;
  }

  protected getTicker(): Ticker {
    if (!this.ticker) {
      throw new Error();
    }
    return this.ticker;
  }

  protected debug(message: string): void {
    this.logger.debug({ scheduler: true }, message);
  }

  protected scheduleMessage(
    message: Message,
    timestamp: number,
    multi?: Multi,
    cb?: TCallback<number>,
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

  protected scheduleNextDelivery(msg: string, multi: Multi): void {
    const message = Message.createFromMessage(msg);
    if (this.isPeriodic(message)) {
      const timestamp = this.getNextScheduledTimestamp(message) ?? -1;
      if (timestamp >= 0) {
        const newMessage = Message.createFromMessage(message, true);
        this.scheduleMessage(newMessage, timestamp, multi);
      }
    }
  }

  protected deliverScheduledMessage(
    msg: string,
    multi: Multi,
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
      multi.exec(cb);
    }
  }

  protected run(callback: TCallback<void>): void {
    this.getLockManager().acquireLock(
      this.keyLockScheduler,
      10000,
      (err?: Error | null) => {
        if (err) this.instance.error(err);
        else {
          const now = Date.now();
          const process = (messages: string[], cb: TCallback<void>) => {
            if (messages.length) {
              async.each(
                messages,
                (msg: string, _: string | number, done: TCallback<unknown>) => {
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
              (err, messages) => {
                if (err) cb(err);
                else cb(null, messages);
              },
            );
          };
          async.waterfall([fetch, process], callback);
        }
      },
    );
  }

  protected tick(): void {
    this.run((err?: Error | null) => {
      if (err) this.instance.error(err);
      else this.getTicker().nextTick();
    });
  }

  protected getNextScheduledTimestamp(message: Message): number | null {
    if (this.isSchedulable(message)) {
      const getScheduleRepeatTimestamp = () => {
        const msgScheduledRepeat = message.getMessageScheduledRepeat();
        if (msgScheduledRepeat) {
          const newCount = message.incrMessageScheduledRepeatCount();
          if (newCount < message.getMessageScheduledRepeat()) {
            const now = Date.now();
            const msgScheduledPeriod = message.getMessageScheduledPeriod();
            if (msgScheduledPeriod) {
              return now + msgScheduledPeriod;
            }
            return now;
          }
          message.resetMessageScheduledRepeatCount();
        }
        return 0;
      };
      const getDelayTimestamp = () => {
        const msgScheduledDelay = message.getMessageScheduledDelay();
        const msgScheduledCron = message.getMessageScheduledCRON();
        if (msgScheduledDelay && !msgScheduledCron && !message.isDelayed()) {
          message.setMessageDelayed(true);
          return Date.now() + msgScheduledDelay;
        }
        return 0;
      };
      const delayTimestamp = getDelayTimestamp();
      if (delayTimestamp) {
        return delayTimestamp;
      }
      const msgScheduledCron = message.getMessageScheduledCRON();
      const nextCRONTimestamp = msgScheduledCron
        ? parseExpression(msgScheduledCron).next().getTime()
        : 0;
      const nextRepeatTimestamp = getScheduleRepeatTimestamp();
      if (nextCRONTimestamp && nextRepeatTimestamp) {
        if (
          !message.hasScheduledCronFired() ||
          nextCRONTimestamp < nextRepeatTimestamp
        ) {
          //@todo Modify message from outside this function
          //@todo Function getNextScheduledTimestamp() should just return values
          message.setMessageScheduledRepeatCount(0);
          message.setMessageScheduledCronFired(true);
          return nextCRONTimestamp;
        }
        return nextRepeatTimestamp;
      }
      if (nextCRONTimestamp) return nextCRONTimestamp;
      return nextRepeatTimestamp;
    }
    return null;
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

  schedule(message: Message, multi?: Multi, cb?: TCallback<number>): void {
    const timestamp = this.getNextScheduledTimestamp(message) ?? -1;
    if (timestamp >= 0) {
      this.scheduleMessage(message, timestamp, multi, cb);
    }
  }

  start(): void {
    this.powerManager.goingUp();
    const config = this.instance.getConfig();
    LockManager.getInstance(config, (l: LockManager) => {
      this.lockManagerInstance = l;
      RedisClient.getNewInstance(config, (c) => {
        this.redisClientInstance = c;
        this.powerManager.commit();
        this.instance.emit(events.SCHEDULER_UP);
      });
    });
  }

  stop(): void {
    this.powerManager.goingDown();
    const shutdownFn = () => {
      if (this.powerManager.isGoingDown()) {
        this.getLockManager().quit(() => {
          this.lockManagerInstance = null;
          this.getRedisClient().end(true);
          this.redisClientInstance = null;
          this.powerManager.commit();
          this.instance.emit(events.SCHEDULER_DOWN);
        });
      }
    };
    if (this.ticker) {
      if (!this.getLockManager().isLocked()) shutdownFn();
      else this.ticker.shutdown(shutdownFn);
    } else shutdownFn();
  }

  runTicker(): void {
    if (!this.ticker) {
      this.ticker = new Ticker(() => {
        this.tick();
      }, this.tickPeriod);
      this.tick();
    }
  }
}
