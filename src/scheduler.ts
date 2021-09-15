import * as async from 'neo-async';
import { Instance } from './instance';
import {
  TCallback,
  TGetScheduledMessagesReply,
  TRedisClientMulti,
} from '../types';
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
  protected keyIndexQueueDelayedMessages: string;

  protected tickPeriod: number;

  constructor(instance: Instance, tickPeriod = 1000) {
    this.instance = instance;
    const {
      keyLockScheduler,
      keyQueue,
      keyQueueDelayed,
      keyIndexQueueDelayedMessages,
    } = instance.getInstanceRedisKeys();
    this.keyLockScheduler = keyLockScheduler;
    this.keyQueue = keyQueue;
    this.keyQueueDelayed = keyQueueDelayed;
    this.keyIndexQueueDelayedMessages = keyIndexQueueDelayedMessages;
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
    mixed: TRedisClientMulti | TCallback<boolean>,
  ): void {
    const schedule = (m: TRedisClientMulti) => {
      const msgStr = message.toString();
      m.zadd(this.keyQueueDelayed, timestamp, msgStr);
      m.hset(this.keyIndexQueueDelayedMessages, message.getId(), msgStr);
      return m;
    };
    if (typeof mixed === 'object') schedule(mixed);
    else if (typeof mixed === 'function') {
      const m = this.getRedisClient().multi();
      schedule(m).exec((err) => {
        if (err) mixed(err);
        else mixed(null, true);
      });
    } else {
      throw new Error(
        'Invalid function argument [mixed]. Expected a callback or an instance of Multi.',
      );
    }
  }

  protected scheduleNextDelivery(msg: Message, multi: TRedisClientMulti): void {
    if (this.isPeriodic(msg)) {
      const timestamp = this.getNextScheduledTimestamp(msg) ?? 0;
      if (timestamp > 0) {
        this.scheduleMessage(msg, timestamp, multi);
      }
    }
  }

  protected deliverScheduledMessage(
    msg: Message,
    multi: TRedisClientMulti,
  ): void {
    const message = this.isPeriodic(msg)
      ? Message.createFromMessage(msg, true)
      : msg;
    multi.lpush(this.keyQueue, message.toString());
    multi.zrem(this.keyQueueDelayed, msg.toString());
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
                      const message = Message.createFromMessage(msg);
                      const multi = this.getRedisClient().multi();
                      this.deliverScheduledMessage(message, multi);
                      this.scheduleNextDelivery(message, multi);
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
    mixed: TRedisClientMulti | TCallback<boolean>,
  ): void {
    const timestamp = this.getNextScheduledTimestamp(message) ?? 0;
    if (timestamp > 0) {
      this.scheduleMessage(message, timestamp, mixed);
    } else if (typeof mixed === 'function') mixed(null, false);
  }

  deleteScheduledMessage(messageId: string, cb: TCallback<boolean>): void {
    const getMessage = (cb: TCallback<string>) => {
      this.getRedisClient().hget(
        this.keyIndexQueueDelayedMessages,
        messageId,
        (err, message) => {
          if (err) cb(err);
          else cb(null, message);
        },
      );
    };
    const deleteMessage = (msg: string | null, cb: TCallback<boolean>) => {
      if (msg) {
        const multi = this.getRedisClient().multi();
        multi.zrem(this.keyQueueDelayed, msg);
        multi.hdel(this.keyIndexQueueDelayedMessages, messageId);
        this.getRedisClient().execMulti(
          multi,
          (err?: Error | null, reply?: number[] | null) => {
            if (err) cb(err);
            else cb(null, reply && reply[0] === 1 && reply[1] === 1);
          },
        );
      } else cb(null, false);
    };
    async.waterfall([getMessage, deleteMessage], (err, result?: boolean) =>
      cb(err, result),
    );
  }

  getScheduledMessages(
    skip: number,
    take: number,
    cb: TCallback<TGetScheduledMessagesReply>,
  ): void {
    if (skip < 0 || take <= 0) {
      cb(
        new Error(
          `Parameter [skip] should be >= 0. Parameter [take] should be >= 1.`,
        ),
      );
    } else {
      const getTotal = (cb: TCallback<number>) => {
        this.getRedisClient().zcard(this.keyQueueDelayed, cb);
      };
      const getItems = (
        total: number,
        cb: TCallback<TGetScheduledMessagesReply>,
      ) => {
        if (!total) {
          cb(null, {
            total,
            items: [],
          });
        } else {
          this.getRedisClient().zrange(
            this.keyQueueDelayed,
            skip,
            skip + take - 1,
            (err, result) => {
              if (err) cb(err);
              else {
                const items = (result ?? []).map((msg) =>
                  Message.createFromMessage(msg),
                );
                cb(null, { total, items });
              }
            },
          );
        }
      };
      async.waterfall(
        [getTotal, getItems],
        (err?: Error | null, result?: TGetScheduledMessagesReply) => {
          if (err) cb(err);
          else cb(null, result);
        },
      );
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
