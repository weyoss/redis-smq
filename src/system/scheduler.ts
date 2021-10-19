import { Broker } from './broker';
import { ICallback, TRedisClientMulti } from '../../types';
import * as async from 'async';
import { Message } from '../message';
import { metadata } from './metadata';
import { RedisClient } from './redis-client';
import { redisKeys } from './redis-keys';
import { EventEmitter } from 'events';
import { parseExpression } from 'cron-parser';

export class Scheduler extends EventEmitter {
  protected static instance: Scheduler | null = null;
  protected queueName: string;
  protected redisClient: RedisClient;
  protected keys: ReturnType<typeof redisKeys['getKeys']>;

  constructor(queueName: string, redisClient: RedisClient) {
    super();
    this.queueName = queueName;
    this.keys = redisKeys.getKeys(queueName);
    this.redisClient = redisClient;
  }

  protected scheduleAtTimestamp(
    message: Message,
    timestamp: number,
    mixed: TRedisClientMulti | ICallback<boolean>,
  ): void {
    const { keyQueueScheduledMessages } = this.keys;
    const schedule = (m: TRedisClientMulti) => {
      const msgStr = message.toString();
      m.zadd(keyQueueScheduledMessages, timestamp, msgStr);
      metadata.preMessageScheduled(message, this.queueName, m);
      return m;
    };
    if (typeof mixed === 'object') schedule(mixed);
    else if (typeof mixed === 'function') {
      const m = this.redisClient.multi();
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

  protected enqueueScheduledMessage(
    broker: Broker,
    msg: Message,
    multi: TRedisClientMulti,
  ): void {
    const { keyQueueScheduledMessages } = this.keys;
    multi.zrem(keyQueueScheduledMessages, msg.toString());
    const message = this.isPeriodic(msg) ? msg.reset() : msg;
    metadata.preMessageScheduledEnqueue(message, this.queueName, multi);
    broker.enqueueMessage(this.queueName, message, multi);
  }

  protected scheduleAtNextTimestamp(
    msg: Message,
    multi: TRedisClientMulti,
  ): void {
    if (this.isPeriodic(msg)) {
      const timestamp = this.getNextScheduledTimestamp(msg) ?? 0;
      if (timestamp > 0) {
        this.scheduleAtTimestamp(msg, timestamp, multi);
      }
    }
  }

  enqueueScheduledMessages(broker: Broker, cb: ICallback<void>): void {
    const now = Date.now();
    const { keyQueueScheduledMessages } = this.keys;
    const process = (messages: string[], cb: ICallback<void>) => {
      if (messages.length) {
        async.each<string, Error>(
          messages,
          (msg, done) => {
            const message = Message.createFromMessage(msg);
            const multi = this.redisClient.multi();
            this.enqueueScheduledMessage(broker, message, multi);
            this.scheduleAtNextTimestamp(message, multi);
            multi.exec(done);
          },
          cb,
        );
      } else cb();
    };
    const fetch = (cb: ICallback<string[]>) => {
      this.redisClient.zrangebyscore(keyQueueScheduledMessages, 0, now, cb);
    };
    async.waterfall([fetch, process], cb);
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
    mixed: TRedisClientMulti | ICallback<boolean>,
  ): void {
    const timestamp = this.getNextScheduledTimestamp(message) ?? 0;
    if (timestamp > 0) {
      this.scheduleAtTimestamp(message, timestamp, mixed);
    } else if (typeof mixed === 'function') mixed(null, false);
  }

  quit(cb: ICallback<void>): void {
    if (this === Scheduler.instance) {
      this.redisClient.halt(() => {
        Scheduler.instance = null;
        cb();
      });
    } else cb();
  }
}
