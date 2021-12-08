import { Message } from '../../message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import * as async from 'async';
import { RedisClient } from '../../redis-client/redis-client';
import {
  ICallback,
  TGetScheduledMessagesReply,
  TRedisClientMulti,
} from '../../../../types';
import { parseExpression } from 'cron-parser';
import { getPaginatedSortedSetMessages, getSortedSetSize } from '../common';
import { Handler } from './handler';
import { EnqueueHandler } from './enqueue.handler';
import { LockManager } from '../../common/lock-manager/lock-manager';

export class ScheduleHandler extends Handler {
  protected enqueueHandler: EnqueueHandler;

  constructor(redisClient: RedisClient, enqueueHandler: EnqueueHandler) {
    super(redisClient);
    this.enqueueHandler = enqueueHandler;
  }

  getScheduledMessagesCount(cb: ICallback<number>): void {
    const { keyQueueScheduled } = redisKeys.getGlobalKeys();
    getSortedSetSize(this.redisClient, keyQueueScheduled, cb);
  }

  getScheduledMessages(
    skip: number,
    take: number,
    cb: ICallback<TGetScheduledMessagesReply>,
  ): void {
    const { keyQueueScheduled, keyScheduledMessages } =
      redisKeys.getGlobalKeys();
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyScheduledMessages,
      keyQueueScheduled,
      skip,
      take,
      cb,
    );
  }

  deleteScheduled(messageId: string, cb: ICallback<void>): void {
    const {
      keyQueueScheduled,
      keyScheduledMessages,
      keyLockDeleteScheduledMessage,
    } = redisKeys.getGlobalKeys();
    LockManager.lockFN(
      this.redisClient,
      keyLockDeleteScheduledMessage,
      (cb) => {
        // Not checking message existence.
        // If the message exists it will be deleted.
        // Otherwise, assuming that it has been already deleted
        const multi = this.redisClient.multi();
        multi.hdel(keyScheduledMessages, messageId);
        multi.zrem(keyQueueScheduled, messageId);
        this.redisClient.execMulti(multi, (err) => cb(err));
      },
      cb,
    );
  }

  protected scheduleMessage(
    multi: TRedisClientMulti,
    message: Message,
    timestamp: number,
  ): void {
    const { keyQueueScheduled, keyScheduledMessages } =
      redisKeys.getGlobalKeys();
    message.setScheduledAt(Date.now());
    const messageId = message.getId();
    multi.zadd(keyQueueScheduled, timestamp, messageId);
    multi.hset(keyScheduledMessages, messageId, JSON.stringify(message));
  }

  schedule(
    message: Message,
    multi: TRedisClientMulti | undefined,
    cb: ICallback<boolean> = () => void 0,
  ): void {
    const timestamp = ScheduleHandler.getNextScheduledTimestamp(message) ?? 0;
    if (timestamp > 0) {
      if (multi) this.scheduleMessage(multi, message, timestamp);
      else {
        const multi = this.redisClient.multi();
        this.scheduleMessage(multi, message, timestamp);
        this.redisClient.execMulti(multi, (err) => {
          if (err) cb(err);
          else cb(null, true);
        });
      }
    } else cb(null, false);
  }

  enqueueScheduledMessages(
    redisClient: RedisClient,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    const { keyQueueScheduled, keyScheduledMessages } =
      redisKeys.getGlobalKeys();
    const enqueue = (messages: string[], cb: ICallback<void>) => {
      if (messages.length) {
        async.each<string, Error>(
          messages,
          (msg, done) => {
            const message = Message.createFromMessage(msg);
            const messageId = message.getId();
            const multi = redisClient.multi();
            this.enqueueHandler.enqueue(multi, message, withPriority);
            const nextScheduleTimestamp =
              ScheduleHandler.getNextScheduledTimestamp(message);
            if (nextScheduleTimestamp) {
              multi.zadd(keyQueueScheduled, nextScheduleTimestamp, messageId);
              multi.hset(
                keyScheduledMessages,
                messageId,
                JSON.stringify(message),
              );
            } else {
              multi.zrem(keyQueueScheduled, messageId);
              multi.hdel(keyScheduledMessages, messageId);
            }
            redisClient.execMulti(multi, (err) => done(err));
          },
          cb,
        );
      } else cb();
    };
    const fetchIds = (cb: ICallback<string[]>) => {
      redisClient.zrangebyscore(keyQueueScheduled, 0, Date.now(), cb);
    };
    const fetchMessages = (ids: string[], cb: ICallback<Message[]>) => {
      if (ids.length) {
        redisClient.hmget(keyScheduledMessages, ids, (err, reply) => {
          if (err) cb(err);
          else {
            const messages = (reply ?? []).map((i) =>
              Message.createFromMessage(i),
            );
            cb(null, messages);
          }
        });
      } else cb(null, []);
    };
    async.waterfall([fetchIds, fetchMessages, enqueue], (err) => cb(err));
  }

  static getNextScheduledTimestamp(message: Message): number {
    if (message.isSchedulable()) {
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
}
