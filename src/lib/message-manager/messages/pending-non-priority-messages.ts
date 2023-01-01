import { TGetMessagesReply, TQueueParams } from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { MessageNotFoundError } from '../errors/message-not-found.error';
import { ListMessageStorage } from '../message-storage/list-message-storage';
import { Queue } from '../../queue-manager/queue';
import { ICallback } from 'redis-smq-common/dist/types';

export class PendingNonPriorityMessages extends ListMessageStorage {
  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(this.config, queue);
    const { keyQueuePending } = redisKeys.getQueueKeys(queueParams);
    this.purgeMessages({ keyMessages: keyQueuePending }, (err) => {
      if (err) cb(err);
      else {
        this.logger.info(
          `Pending messages from queue (${JSON.stringify(
            queue,
          )})  have been deleted`,
        );
        cb();
      }
    });
  }

  delete(
    queue: string | TQueueParams,

    messageId: string,
    sequenceId: number,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(this.config, queue);
    const { keyQueuePending } = redisKeys.getQueueKeys(queueParams);
    this.deleteMessage(
      { keyMessages: keyQueuePending },
      { messageId, sequenceId },
      (err) => {
        // In case the message does not exist
        // we assume it was delivered or already deleted
        const error = err instanceof MessageNotFoundError ? null : err;
        if (error) cb(error);
        else {
          this.logger.info(
            `Pending message (ID ${messageId}) has been deleted`,
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
    const { keyQueuePending } = redisKeys.getQueueKeys(queueParams);
    this.fetchMessages({ keyMessages: keyQueuePending }, skip, take, cb);
  }

  count(queue: string | TQueueParams, cb: ICallback<number>): void {
    const queueParams = Queue.getParams(this.config, queue);
    const { keyQueuePending } = redisKeys.getQueueKeys(queueParams);
    this.countMessages({ keyMessages: keyQueuePending }, cb);
  }
}
