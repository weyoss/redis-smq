import { ICallback, TGetMessagesReply } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { RedisClient } from '../../common/redis-client/redis-client';
import { SortedSet } from './message-storage/sorted-set';

export class ScheduledMessages extends SortedSet {
  delete(messageId: string, cb: ICallback<void>): void {
    const { keyScheduledMessages, keyScheduledMessageIds } =
      redisKeys.getMainKeys();
    this.deleteMessage(
      {
        keyMessages: keyScheduledMessages,
        keyMessagesWeight: keyScheduledMessageIds,
      },
      { messageId },
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Scheduled message (ID ${messageId}) has been deleted`,
          );
          cb();
        }
      },
    );
  }

  purge(cb: ICallback<void>): void {
    const { keyScheduledMessageIds, keyScheduledMessages } =
      redisKeys.getMainKeys();
    this.purgeMessages(
      {
        keyMessages: keyScheduledMessages,
        keyMessagesWeight: keyScheduledMessageIds,
      },
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(`Scheduled messages have been deleted`);
          cb();
        }
      },
    );
  }

  list(skip: number, take: number, cb: ICallback<TGetMessagesReply>): void {
    const { keyScheduledMessageIds, keyScheduledMessages } =
      redisKeys.getMainKeys();
    this.fetchMessages(
      {
        keyMessages: keyScheduledMessages,
        keyMessagesWeight: keyScheduledMessageIds,
      },
      skip,
      take,
      cb,
    );
  }

  static count(redisClient: RedisClient, cb: ICallback<number>): void {
    const { keyScheduledMessageIds } = redisKeys.getMainKeys();
    redisClient.zcard(keyScheduledMessageIds, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? 0);
    });
  }
}
