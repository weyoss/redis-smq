import { TGetMessagesReply } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSet } from './message-storage/sorted-set';
import { ICallback } from 'redis-smq-common/dist/types';

export class ScheduledMessages extends SortedSet {
  delete(messageId: string, cb: ICallback<void>): void {
    const { keyScheduledMessages, keyScheduledMessageWeight } =
      redisKeys.getMainKeys();
    this.deleteMessage(
      {
        keyMessages: keyScheduledMessages,
        keyMessagesWeight: keyScheduledMessageWeight,
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
    const { keyScheduledMessageWeight, keyScheduledMessages } =
      redisKeys.getMainKeys();
    this.purgeMessages(
      {
        keyMessages: keyScheduledMessages,
        keyMessagesWeight: keyScheduledMessageWeight,
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
    const { keyScheduledMessageWeight, keyScheduledMessages } =
      redisKeys.getMainKeys();
    this.fetchMessages(
      {
        keyMessages: keyScheduledMessages,
        keyMessagesWeight: keyScheduledMessageWeight,
      },
      skip,
      take,
      cb,
    );
  }

  count(cb: ICallback<number>): void {
    const { keyScheduledMessageWeight, keyScheduledMessages } =
      redisKeys.getMainKeys();
    this.countMessages(
      {
        keyMessages: keyScheduledMessages,
        keyMessagesWeight: keyScheduledMessageWeight,
      },
      cb,
    );
  }
}
