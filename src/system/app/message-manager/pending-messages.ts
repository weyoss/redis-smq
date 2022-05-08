import { ICallback, TGetMessagesReply, TQueueParams } from '../../../../types';
import { getQueueParams } from '../queue-manager/queue';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { MessageNotFoundError } from './errors/message-not-found.error';
import { List } from './message-storage/list';

export class PendingMessages extends List {
  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = getQueueParams(queue);
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
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = getQueueParams(queue);
    const { keyQueuePending } = redisKeys.getQueueKeys(queueParams);
    this.deleteMessage(
      { keyMessages: keyQueuePending },
      { sequenceId, messageId },
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
    const queueParams = getQueueParams(queue);
    const { keyQueuePending } = redisKeys.getQueueKeys(queueParams);
    this.fetchMessages({ keyMessages: keyQueuePending }, skip, take, cb);
  }
}
