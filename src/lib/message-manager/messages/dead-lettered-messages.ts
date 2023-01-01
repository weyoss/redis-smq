import { TGetMessagesReply, TQueueParams } from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { ListMessageStorage } from '../message-storage/list-message-storage';
import { Queue } from '../../queue-manager/queue';
import { ICallback } from 'redis-smq-common/dist/types';

export class DeadLetteredMessages extends ListMessageStorage {
  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(this.config, queue);
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
    const queueParams = Queue.getParams(this.config, queue);
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
    const queueParams = Queue.getParams(this.config, queue);
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
    const queueParams = Queue.getParams(this.config, queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(queueParams);
    this.fetchMessages({ keyMessages: keyQueueDL }, skip, take, cb);
  }

  count(queue: string | TQueueParams, cb: ICallback<number>): void {
    const queueParams = Queue.getParams(this.config, queue);
    const { keyQueueDL } = redisKeys.getQueueKeys(queueParams);
    this.countMessages({ keyMessages: keyQueueDL }, cb);
  }
}
