import { Message } from '../../message';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import * as async from 'async';
import {
  ICallback,
  TGetScheduledMessagesReply,
  TRedisClientMulti,
} from '../../../../types';
import { parseExpression } from 'cron-parser';
import { getPaginatedSortedSetMessages, getSortedSetSize } from '../common';
import { Handler } from './handler';
import { LockManager } from '../../common/lock-manager/lock-manager';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { PanicError } from '../../common/errors/panic.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { ArgumentError } from '../../common/errors/argument.error';

export class ScheduleHandler extends Handler {
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
      async.each<Message, Error>(
        messages,
        (msg, done) => {
          const message = Message.createFromMessage(msg);
          const queue = message.getQueue();
          if (!queue) {
            throw new PanicError(
              `Expected a message with a non-empty queue value`,
            );
          }
          const {
            keyQueues,
            keyQueuePending,
            keyQueuePendingWithPriority,
            keyQueuePriority,
            keyScheduledMessages,
            keyScheduledMessagesIndex,
          } = redisKeys.getKeys(queue.name, queue.ns);
          const nextScheduleTimestamp =
            ScheduleHandler.getNextScheduledTimestamp(message);
          message.setPublishedAt(Date.now());
          this.redisClient.runScript(
            ELuaScriptName.ENQUEUE_SCHEDULED_MESSAGE,
            [
              keyQueues,
              JSON.stringify(queue),
              message.getId(),
              JSON.stringify(message),
              message.getPriority() ?? '',
              keyQueuePendingWithPriority,
              keyQueuePriority,
              keyQueuePending,
              `${nextScheduleTimestamp}`,
              keyScheduledMessages,
              keyScheduledMessagesIndex,
            ],
            (err) => done(err),
          );
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

  purgeScheduledMessages(cb: ICallback<void>): void {
    const { keyScheduledMessages, keyScheduledMessagesIndex } =
      redisKeys.getGlobalKeys();
    const multi = this.redisClient.multi();
    multi.del(keyScheduledMessagesIndex);
    multi.del(keyScheduledMessages);
    this.redisClient.execMulti(multi, (err) => cb(err));
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

  // This method is used exclusively from the producer.
  // It registers the message queue and then schedules the message.
  xSchedule(message: Message, cb: ICallback<boolean>): void {
    const timestamp = ScheduleHandler.getNextScheduledTimestamp(message) ?? 0;
    if (timestamp > 0) {
      const queue = message.getQueue();
      if (!queue) cb(new ArgumentError('Message queue is required'));
      else {
        const { keyQueues, keyScheduledMessages, keyScheduledMessagesIndex } =
          redisKeys.getKeys(queue.name, queue.ns);
        message.setScheduledAt(Date.now());
        const messageId = message.getId();
        this.redisClient.runScript(
          ELuaScriptName.SCHEDULE_MESSAGE,
          [
            keyQueues,
            JSON.stringify(queue),
            messageId,
            JSON.stringify(message),
            `${timestamp}`,
            keyScheduledMessages,
            keyScheduledMessagesIndex,
          ],
          (err) => {
            if (err) cb(err);
            else cb(null, true);
          },
        );
      }
    } else cb(null, false);
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
