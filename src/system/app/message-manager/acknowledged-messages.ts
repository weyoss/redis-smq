import { ICallback, TGetMessagesReply, TQueueParams } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { List } from './message-storage/list';
import { Queue } from '../queue-manager/queue';
import { RedisClient } from '../../common/redis-client/redis-client';

export class AcknowledgedMessages extends List {
  list(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queueParams);
    this.fetchMessages({ keyMessages: keyQueueAcknowledged }, skip, take, cb);
  }

  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queueParams);
    this.purgeMessages({ keyMessages: keyQueueAcknowledged }, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Acknowledged messages from queue (${JSON.stringify(
            queue,
          )}) have been deleted`,
        );
        cb();
      }
    });
  }

  requeue(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queueParams);
    this.requeueMessage(keyQueueAcknowledged, sequenceId, messageId, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Acknowledged message (ID ${messageId}) has been re-queued`,
        );
        cb();
      }
    });
  }

  delete(
    queue: string | TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queueParams);
    this.deleteMessage(
      { keyMessages: keyQueueAcknowledged },
      { sequenceId, messageId },
      (err) => {
        if (err) cb(err);
        else {
          this.logger.info(
            `Acknowledged message (ID ${messageId}) has been deleted`,
          );
          cb();
        }
      },
    );
  }

  static count(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queueParams);
    redisClient.llen(keyQueueAcknowledged, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? 0);
    });
  }
}
