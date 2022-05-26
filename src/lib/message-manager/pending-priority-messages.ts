import { TGetMessagesReply, TQueueParams } from '../../../types';
import { Queue } from '../queue-manager/queue';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSet } from './message-storage/sorted-set';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';

export class PendingPriorityMessages extends SortedSet {
  delete(
    queue: string | TQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(this.config, queue);
    const {
      keyQueuePendingPriorityMessageWeight,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams);
    this.deleteMessage(
      {
        keyMessages: keyQueuePendingPriorityMessages,
        keyMessagesWeight: keyQueuePendingPriorityMessageWeight,
      },
      { messageId },
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Pending message with priority (ID ${messageId}) has been deleted`,
          );
          cb();
        }
      },
    );
  }

  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(this.config, queue);
    const {
      keyQueuePendingPriorityMessageWeight,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams);
    this.purgeMessages(
      {
        keyMessages: keyQueuePendingPriorityMessages,
        keyMessagesWeight: keyQueuePendingPriorityMessageWeight,
      },
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Priority messages from queue (${JSON.stringify(
              queue,
            )}) have been deleted`,
          );
          cb();
        }
      },
    );
  }

  list(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams = Queue.getParams(this.config, queue);
    const {
      keyQueuePendingPriorityMessageWeight,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams);
    this.fetchMessages(
      {
        keyMessages: keyQueuePendingPriorityMessages,
        keyMessagesWeight: keyQueuePendingPriorityMessageWeight,
      },
      skip,
      take,
      cb,
    );
  }

  static count(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueuePendingPriorityMessageWeight } =
      redisKeys.getQueueKeys(queue);
    redisClient.zcard(keyQueuePendingPriorityMessageWeight, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? 0);
    });
  }

  count(queue: string | TQueueParams, cb: ICallback<number>): void {
    const queueParams = Queue.getParams(this.config, queue);
    const {
      keyQueuePendingPriorityMessageWeight,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams);
    this.countMessages(
      {
        keyMessages: keyQueuePendingPriorityMessages,
        keyMessagesWeight: keyQueuePendingPriorityMessageWeight,
      },
      cb,
    );
  }
}
