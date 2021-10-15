import { Scheduler as BaseScheduler } from '../scheduler';
import { Broker } from './broker';
import { ICallback, TRedisClientMulti } from '../../types';
import * as async from 'async';
import { Message } from '../message';
import { events } from './events';
import { Metadata } from './metadata';
import { RedisClient } from './redis-client';

export class Scheduler extends BaseScheduler {
  protected metadata: Metadata;

  constructor(queueName: string, redisClient: RedisClient) {
    super(queueName, redisClient);
    this.metadata = new Metadata(this);
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

  protected enqueueScheduledMessage(
    broker: Broker,
    msg: Message,
    multi: TRedisClientMulti,
  ): void {
    const { keyQueueScheduledMessages } = this.keys;
    multi.zrem(keyQueueScheduledMessages, msg.toString());
    const message = this.isPeriodic(msg)
      ? Message.createFromMessage(msg, true)
      : msg;
    this.emit(
      events.PRE_MESSAGE_SCHEDULED_ENQUEUE,
      message,
      this.queueName,
      multi,
    );
    broker.enqueueMessage(message, multi);
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

  quit(cb: ICallback<void>): void {
    if (this === Scheduler.instance) {
      this.redisClient.halt(() => {
        Scheduler.instance = null;
        cb();
      });
    } else cb();
  }
}
