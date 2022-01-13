import { Message } from '../../message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import * as async from 'async';
import { RedisClient } from '../../common/redis-client/redis-client';
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
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';

export class ScheduleHandler extends Handler {
  protected enqueueHandler: EnqueueHandler;

  constructor(redisClient: RedisClient, enqueueHandler: EnqueueHandler) {
    super(redisClient);
    this.enqueueHandler = enqueueHandler;
  }

  protected scheduleMessage(
    multi: TRedisClientMulti,
    message: Message,
    timestamp: number,
  ): void {
    const { keyScheduledMessages, keyScheduledMessagesIndex } =
      redisKeys.getGlobalKeys();
    message.setScheduledAt(Date.now());
    const messageId = message.getId();
    multi.zadd(keyScheduledMessages, timestamp, messageId);
    multi.hset(keyScheduledMessagesIndex, messageId, JSON.stringify(message));
  }

  protected enqueueMessages = (
    messages: Message[],
    cb: ICallback<void>,
  ): void => {
    if (messages.length) {
      const { keyScheduledMessages, keyScheduledMessagesIndex } =
        redisKeys.getGlobalKeys();
      async.each<Message, Error>(
        messages,
        (msg, done) => {
          const message = Message.createFromMessage(msg);
          const messageId = message.getId();
          const multi = this.redisClient.multi();
          this.enqueueHandler.enqueue(multi, message);
          const nextScheduleTimestamp =
            ScheduleHandler.getNextScheduledTimestamp(message);
          if (nextScheduleTimestamp) {
            multi.zadd(keyScheduledMessages, nextScheduleTimestamp, messageId);
            multi.hset(
              keyScheduledMessagesIndex,
              messageId,
              JSON.stringify(message),
            );
          } else {
            multi.zrem(keyScheduledMessages, messageId);
            multi.hdel(keyScheduledMessagesIndex, messageId);
          }
          this.redisClient.execMulti(multi, (err) => done(err));
        },
        cb,
      );
    } else cb();
  };

  protected fetchMessages = (ids: string[], cb: ICallback<Message[]>): void => {
    if (ids.length) {
      const { keyScheduledMessagesIndex } = redisKeys.getGlobalKeys();
      this.redisClient.hmget(keyScheduledMessagesIndex, ids, (err, reply) => {
        if (err) cb(err);
        else {
          const messages: Message[] = [];
          async.eachOf(
            reply ?? [],
            (item, index, done) => {
              if (!item) done(new EmptyCallbackReplyError());
              else {
                messages.push(Message.createFromMessage(item));
                done();
              }
            },
            (err) => {
              if (err) cb(err);
              else cb(null, messages);
            },
          );
        }
      });
    } else cb(null, []);
  };

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    const { keyScheduledMessages } = redisKeys.getGlobalKeys();
    this.redisClient.zrangebyscore(keyScheduledMessages, 0, Date.now(), cb);
  };

  getScheduledMessagesCount(cb: ICallback<number>): void {
    const { keyScheduledMessages } = redisKeys.getGlobalKeys();
    getSortedSetSize(this.redisClient, keyScheduledMessages, cb);
  }

  getScheduledMessages(
    skip: number,
    take: number,
    cb: ICallback<TGetScheduledMessagesReply>,
  ): void {
    const { keyScheduledMessages, keyScheduledMessagesIndex } =
      redisKeys.getGlobalKeys();
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyScheduledMessagesIndex,
      keyScheduledMessages,
      skip,
      take,
      cb,
    );
  }

  deleteScheduled(messageId: string, cb: ICallback<void>): void {
    const {
      keyScheduledMessages,
      keyScheduledMessagesIndex,
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
        multi.hdel(keyScheduledMessagesIndex, messageId);
        multi.zrem(keyScheduledMessages, messageId);
        this.redisClient.execMulti(multi, (err) => cb(err));
      },
      cb,
    );
  }

  schedule(
    message: Message,
    mixed: TRedisClientMulti | ICallback<boolean>,
  ): void {
    const timestamp = ScheduleHandler.getNextScheduledTimestamp(message) ?? 0;
    if (timestamp > 0) {
      if (typeof mixed === 'function') {
        const multi = this.redisClient.multi();
        this.scheduleMessage(multi, message, timestamp);
        this.redisClient.execMulti(multi, (err) => {
          if (err) mixed(err);
          else mixed(null, true);
        });
      } else {
        this.scheduleMessage(mixed, message, timestamp);
      }
    } else if (typeof mixed === 'function') mixed(null, false);
  }

  enqueueScheduledMessages(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<string[]>) => {
          this.fetchMessageIds(cb);
        },
        (ids: string[], cb: ICallback<Message[]>) => {
          this.fetchMessages(ids, cb);
        },
        (messages: Message[], cb: ICallback<void>) => {
          this.enqueueMessages(messages, cb);
        },
      ],
      (err) => cb(err),
    );
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
