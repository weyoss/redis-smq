import { ICallback, TGetMessagesReply, TQueueParams } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { List } from './message-storage/list';
import { Queue } from '../queue-manager/queue';
import { RedisClient } from '../../common/redis-client/redis-client';

export class DeadLetteredMessages extends List {
  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(queueParams);
    this.purgeMessages({ keyMessages: keyQueueDL }, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Dead-lettered messages from queue (${JSON.stringify(
            queue,
          )})  have been deleted`,
        );
        cb();
      }
    });
  }

  requeue(
    queue: string | TQueueParams,
    messageId: string,
    sequenceId: number,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(queueParams);
    this.requeueMessage(
      { keyMessages: keyQueueDL },
      { sequenceId, messageId },
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Dead-lettered message (ID ${messageId}) has been re-queued`,
          );
          cb();
        }
      },
    );
  }

  delete(
    queue: string | TQueueParams,
    messageId: string,
    sequenceId: number,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(queueParams);
    this.deleteMessage(
      { keyMessages: keyQueueDL },
      { messageId, sequenceId },
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Dead-lettered message (ID ${messageId}) has been deleted`,
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
    const { keyQueueDL } = redisKeys.getQueueKeys(queueParams);
    this.fetchMessages({ keyMessages: keyQueueDL }, skip, take, cb);
  }

  static count(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(queueParams);
    redisClient.llen(keyQueueDL, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? 0);
    });
  }
}
