import * as async from 'neo-async';
import {
  TCallback,
  TGetScheduledMessagesReply,
  TRedisClientMulti,
} from '../types';
import { Message } from './message';
import { parseExpression } from 'cron-parser';
import { RedisClient } from './redis-client';
import { redisKeys } from './redis-keys';

export class Scheduler {
  protected redisClientInstance: RedisClient | null;
  protected keys: ReturnType<typeof redisKeys['getKeys']>;

  constructor(queueName: string, redisClient: RedisClient) {
    this.keys = redisKeys.getKeys(queueName);
    this.redisClientInstance = redisClient;
  }

  protected getRedisClient(): RedisClient {
    if (!this.redisClientInstance) {
      throw new Error(`Expected an instance of RedisClient`);
    }
    return this.redisClientInstance;
  }

  protected scheduleMessage(
    message: Message,
    timestamp: number,
    mixed: TRedisClientMulti | TCallback<boolean>,
  ): void {
    const { keyQueueDelayed, keyIndexQueueDelayedMessages } = this.keys;
    const schedule = (m: TRedisClientMulti) => {
      const msgStr = message.toString();
      m.zadd(keyQueueDelayed, timestamp, msgStr);
      m.hset(keyIndexQueueDelayedMessages, message.getId(), msgStr);
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

  scheduleNextDelivery(msg: Message, multi: TRedisClientMulti): void {
    if (this.isPeriodic(msg)) {
      const timestamp = this.getNextScheduledTimestamp(msg) ?? 0;
      if (timestamp > 0) {
        this.scheduleMessage(msg, timestamp, multi);
      }
    }
  }

  deliverScheduledMessage(msg: Message, multi: TRedisClientMulti): void {
    const { keyQueue, keyQueueDelayed } = this.keys;
    const message = this.isPeriodic(msg)
      ? Message.createFromMessage(msg, true)
      : msg;
    multi.lpush(keyQueue, message.toString());
    multi.zrem(keyQueueDelayed, msg.toString());
  }

  //@todo Modify message from outside this function
  //@todo and make getNextScheduledTimestamp() return just values
  protected getNextScheduledTimestamp(message: Message): number | null {
    if (this.isSchedulable(message)) {
      // Delay
      const msgScheduledDelay = message.getMessageScheduledDelay();
      if (msgScheduledDelay && !message.isDelayed()) {
        message.setMessageDelayed(true);
        return Date.now() + msgScheduledDelay;
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
    const { keyQueueDelayed, keyIndexQueueDelayedMessages } = this.keys;
    const getMessage = (cb: TCallback<string>) => {
      this.getRedisClient().hget(
        keyIndexQueueDelayedMessages,
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
        multi.zrem(keyQueueDelayed, msg);
        multi.hdel(keyIndexQueueDelayedMessages, messageId);
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
    const { keyQueueDelayed } = this.keys;
    if (skip < 0 || take <= 0) {
      cb(
        new Error(
          `Parameter [skip] should be >= 0. Parameter [take] should be >= 1.`,
        ),
      );
    } else {
      const getTotal = (cb: TCallback<number>) => {
        this.getRedisClient().zcard(keyQueueDelayed, cb);
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
            keyQueueDelayed,
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

  enqueueMessages(cb: TCallback<void>) {
    const now = Date.now();
    const { keyQueueDelayed } = this.keys;
    const process = (messages: string[], cb: TCallback<void>) => {
      if (messages.length) {
        async.each(
          messages,
          (msg: string, _: string | number, done: TCallback<unknown>) => {
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
        keyQueueDelayed,
        0,
        now,
        (err?: Error | null, messages?: string[] | null) => {
          if (err) cb(err);
          else cb(null, messages);
        },
      );
    };
    async.waterfall([fetch, process], (err) => {
      if (err) throw err;
      else cb();
    });
  }

  quit() {
    this.getRedisClient().end(true);
    this.redisClientInstance = null;
  }
}
