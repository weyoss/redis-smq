import { ICallback, TGetMessagesReply, TQueueParams } from '../../../../types';
import { Queue } from '../queue-manager/queue';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { SortedSet } from './message-storage/sorted-set';
import { RedisClient } from '../../common/redis-client/redis-client';

export class PendingPriorityMessages extends SortedSet {
  delete(
    queue: string | TQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams);
    this.deleteMessage(
      {
        keyMessages: keyQueuePendingPriorityMessages,
        keyMessagesWeight: keyQueuePendingPriorityMessageIds,
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
    const queueParams = Queue.getQueueParams(queue);
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams);
    this.purgeMessages(
      {
        keyMessages: keyQueuePendingPriorityMessages,
        keyMessagesWeight: keyQueuePendingPriorityMessageIds,
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
    const queueParams = Queue.getQueueParams(queue);
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queueParams);
    this.fetchMessages(
      {
        keyMessages: keyQueuePendingPriorityMessages,
        keyMessagesWeight: keyQueuePendingPriorityMessageIds,
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
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueuePendingPriorityMessageIds } =
      redisKeys.getQueueKeys(queueParams);
    redisClient.zcard(keyQueuePendingPriorityMessageIds, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? 0);
    });
  }
}
